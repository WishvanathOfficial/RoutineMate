import { sha256 } from '../hash';

describe('sha256', () => {
  it('produces a stable 64-char hex digest', () => {
    const digest = sha256('routinemate');
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic for the same input', () => {
    expect(sha256('same-input')).toBe(sha256('same-input'));
  });

  it('differs for different input', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});
