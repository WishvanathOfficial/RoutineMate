// Isolated on purpose: `import.meta.env` is valid ESM syntax that Vite
// handles natively, but ts-jest's CommonJS transform (see jest.config.js)
// cannot emit it — Node throws "Cannot use 'import.meta' outside a module"
// the instant this file is required. Jest's moduleNameMapper redirects
// `@api/env` to env.jest.ts instead, so this file is never actually loaded
// under test; only real Vite dev/build resolves it.
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000';
