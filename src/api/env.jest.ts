// Jest-only stand-in for env.ts — see the comment there for why. Jest runs
// under Node/CommonJS and has no `import.meta`, so this reads from
// `process.env` instead (settable per-test if ever needed) with the same
// default the real module falls back to.
export const API_BASE_URL: string = process.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
