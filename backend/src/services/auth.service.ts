import { randomBytes, randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { env } from '../config/env';
import { RefreshToken, User, UserPreferences, sequelize } from '../models';
import { ApiError } from '../utils/ApiError';
import { sha256 } from '../utils/hash';
import {
  expiresInToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/** Creates a refresh_tokens row and signs the matching access+refresh JWT pair. */
async function issueTokenPair(user: User): Promise<AuthTokens> {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });
  const refreshTokenExpiresAt = expiresInToDate(env.jwt.refreshExpiresIn);

  await RefreshToken.create({
    id: tokenId,
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: refreshTokenExpiresAt,
    revokedAt: null,
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create(
      { name: input.name, email: input.email, passwordHash },
      { transaction },
    );
    // Every user gets a preferences row at signup — see design doc §7 API mapping.
    await UserPreferences.create({ userId: created.id }, { transaction });
    return created;
  });

  const tokens = await issueTokenPair(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  // defaultScope excludes passwordHash; unscoped() is required to verify credentials.
  const user = await User.unscoped().findOne({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = await issueTokenPair(user);
  return { user: toPublicUser(user), ...tokens };
}

type GoogleTokenInfo = {
  email: string;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  email_verified?: boolean;
  exp?: number;
};

async function verifyGoogleIdToken(credential: string): Promise<GoogleTokenInfo> {
  const clientId = env.google.clientId;
  if (!clientId) {
    throw ApiError.internal('Google OAuth is not configured on the server');
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  if (!response.ok) {
    throw ApiError.unauthorized('Google ID token is invalid');
  }

  const payload = (await response.json()) as Partial<GoogleTokenInfo>;
  if (!payload.email) {
    throw ApiError.unauthorized('Google account email is required');
  }

  if (payload.aud && payload.aud !== clientId) {
    throw ApiError.unauthorized('Google ID token audience mismatch');
  }

  if (
    payload.iss &&
    !['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss)
  ) {
    throw ApiError.unauthorized('Google ID token issuer mismatch');
  }

  if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
    throw ApiError.unauthorized('Google ID token has expired');
  }

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    aud: payload.aud,
    iss: payload.iss,
    email_verified: payload.email_verified,
    exp: payload.exp,
  };
}

export async function googleLogin(input: { credential: string }) {
  const googleUser = await verifyGoogleIdToken(input.credential);

  let user = await User.findOne({ where: { email: googleUser.email } });

  if (!user) {
    const generatedPassword = randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(generatedPassword);

    user = await sequelize.transaction(async (transaction) => {
      const created = await User.create(
        {
          name: googleUser.name || 'Google User',
          email: googleUser.email,
          passwordHash,
          avatarUrl: googleUser.picture ?? null,
        },
        { transaction },
      );
      await UserPreferences.create({ userId: created.id }, { transaction });
      return created;
    });
  } else if (googleUser.picture && user.avatarUrl !== googleUser.picture) {
    user.avatarUrl = googleUser.picture;
    await user.save();
  }

  const tokens = await issueTokenPair(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = sha256(rawRefreshToken);
  const existing = await RefreshToken.findOne({
    where: { id: payload.tokenId, userId: payload.sub, tokenHash },
  });

  if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Rotate: revoke the presented token, issue a brand new pair.
  existing.revokedAt = new Date();
  await existing.save();

  const tokens = await issueTokenPair(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  const tokenHash = sha256(rawRefreshToken);
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash, revokedAt: { [Op.is]: null } } },
  );
}
