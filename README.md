# RoutineMate — MVP-1 Frontend

React + TypeScript + Redux Toolkit implementation of the RoutineMate MVP-1 scope, built with Vite. Source of truth for features/pages is `docs/RoutineMate-Feature-Analysis.md` and `docs/RoutineMate-MVP1-Prototype.html`.

## Getting started

```bash
npm install
npm run dev
```

This project was hand-authored file-by-file in a sandbox with no npm registry access, so no build/lint/test command has actually been executed against it here — only static import-path resolution was verified (all local/aliased imports across 74 source files resolve to real files on disk). Run the commands below yourself after `npm install` to confirm everything compiles, lints, and passes.

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Preview the production build |
| `npm run lint` / `lint:fix` | ESLint over `.ts`/`.tsx` |
| `npm run format` / `format:check` | Prettier over `src/**` |
| `npm test` / `test:watch` / `test:coverage` | Jest unit tests |
| `npm run typecheck` | `tsc --noEmit` |

`npm install` also triggers the `prepare` script (`husky`), which wires up the Git hooks in `.husky/`. `core.hooksPath` is already set to `.husky` in this repo's local git config, and `.husky/pre-commit` runs `npx lint-staged` (lints/formats staged files before each commit).

## Demo login

Seeded user for the login form: `jane@example.com` / `password123`. Registration also works and adds to the in-memory seed data for the session (no real backend — see `*.api.ts` files).

## Folder structure

Each routed feature lives under `src/features/<name>/` with a consistent file set:

```
src/features/<name>/
  <name>.types.ts       # interfaces / types for this feature's domain + state shape
  <name>.api.ts         # mock async "API" layer (simulated network delay, swap for real HTTP later)
  <name>.thunks.ts       # createAsyncThunk wrappers around the api layer
  <name>.slice.ts        # createSlice: reducers + extraReducers for the thunks
  <name>.selectors.ts    # createSelector-based selectors
  <name>.module.scss     # CSS Modules + Sass styles for this feature's pages
  <Name>Page.tsx          # route-level page component(s)
  components/             # feature-local presentational components
  __tests__/              # Jest unit tests (slice reducers; some RTL page tests)
```

Features included: `auth`, `landing`, `dashboard`, `routines`, `stats`, `calendar`, `profile`, and `ui` (cross-cutting theme/sidebar/toast/modal state — no `api`/`thunks` since it's pure client state).

Shared/app-level code:

```
src/app/         # store.ts (root reducer), hooks.ts (typed useAppDispatch/useAppSelector), router.tsx
src/layouts/     # AppLayout (sidebar + topbar + outlet + toast)
src/components/  # Sidebar, Topbar, Modal, Toast, Button, ProgressRing, ProtectedRoute
src/styles/      # _variables.scss, _mixins.scss, global.scss
src/test/        # Jest setupTests.ts
```

## Path aliases

Configured consistently in `tsconfig.json`, `vite.config.ts`, and `jest.config.ts`:

`@app/*`, `@components/*`, `@features/*`, `@layouts/*`, `@styles/*`, `@assets/*`.

## Known limitations / follow-ups

- All "backend" calls are mocked in `*.api.ts` files with simulated latency and in-memory data — no real persistence.
- Dark mode toggles a `dark` class on `<html>`; only a minimal global dark-mode style block exists so far, not full per-component theming.
- Chart.js canvases (`stats` feature) aren't covered by RTL tests since jsdom doesn't implement a real canvas 2D context — those tests are reducer-only.
- This repo's git history was assembled in an environment without npm registry access; Husky hooks are configured but were never exercised end-to-end here (no `node_modules` present to run `lint-staged` against). Run `npm install` locally, then make a test commit to confirm the hook fires.
