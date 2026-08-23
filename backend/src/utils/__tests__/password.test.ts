import { comparePassword, hashPassword } from '../password';

describe('password hashing', () => {
  it('hashes a password to a bcrypt string distinct from the input', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(comparePassword('Sup3rSecret!', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });
});
