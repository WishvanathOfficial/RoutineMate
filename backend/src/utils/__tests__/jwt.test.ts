process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.DB_NAME = process.env.DB_NAME ?? 'routinemate_test';
process.env.DB_USER = process.env.DB_USER ?? 'root';

import {
  expiresInToDate,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt';

describe('access tokens', () => {
  it('round-trips payload through sign + verify', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'demo@routinemate.app' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('demo@routinemate.app');
  });

  it('throws on a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'demo@routinemate.app' });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips payload through sign + verify', () => {
    const token = signRefreshToken({ sub: 'user-1', tokenId: 'token-1' });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.tokenId).toBe('token-1');
  });
});

describe('expiresInToDate', () => {
  it('converts "15m" into ~15 minutes from now', () => {
    const before = Date.now();
    const result = expiresInToDate('15m');
    const diffMinutes = (result.getTime() - before) / 60000;
    expect(diffMinutes).toBeGreaterThan(14.9);
    expect(diffMinutes).toBeLessThan(15.1);
  });

  it('converts "30d" into ~30 days from now', () => {
    const before = Date.now();
    const result = expiresInToDate('30d');
    const diffDays = (result.getTime() - before) / 86_400_000;
    expect(diffDays).toBeGreaterThan(29.99);
    expect(diffDays).toBeLessThan(30.01);
  });
});
