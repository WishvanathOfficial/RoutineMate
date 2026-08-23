import { RefreshToken, Routine, User, UserPreferences, sequelize } from '../models';
import { ApiError } from '../utils/ApiError';
import { UpdatePreferencesInput, UpdateProfileInput } from '../validators/profile.validator';

export async function getProfile(userId: string) {
  const user = await User.findByPk(userId, {
    include: [{ model: UserPreferences, as: 'preferences' }],
  });
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (input.email && input.email !== user.email) {
    const existing = await User.findOne({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Email already in use');
  }

  user.set(input);
  await user.save();
  return user.toJSON();
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  const [prefs] = await UserPreferences.findOrCreate({
    where: { userId },
    defaults: { userId },
  });
  prefs.set(input);
  await prefs.save();
  return prefs.toJSON();
}

/** Danger-zone account delete — design doc §7: "users (soft delete), cascades". */
export async function deleteAccount(userId: string): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) throw ApiError.notFound('User not found');

    // Sequelize's onDelete: CASCADE only fires on a real DB-level DELETE, not
    // a paranoid soft delete — so related rows are soft-deleted/revoked here
    // explicitly to keep the "cascade" behavior the design doc describes.
    await Routine.destroy({ where: { userId }, transaction });
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null }, transaction },
    );
    await user.destroy({ transaction });
  });
}
