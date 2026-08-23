import crypto from 'crypto';

/** One-way hash used to store refresh tokens at rest (never the raw JWT). */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
