# RoutineMate — Frontend ↔ Backend Integration Plan

**Status:** Draft for review · **Scope:** MVP-1 · **Companion docs:** `RoutineMate-MVP1-Database-Design.html` (schema/API mapping), `RoutineMate_Backend-Feature-Analysis.md` (feature spec)

This plan is grounded in a direct read of both sides of the codebase as they exist today:

- **Backend** (`backend/src`): Express routes → controllers → services, Sequelize/MySQL, JWT access + httpOnly-cookie refresh tokens. 6 route groups, 20 endpoints (see the Postman collection at `backend/postman/`).
- **Frontend** (`src/features/*`): 8 Redux Toolkit feature slices (`auth`, `routines`, `dashboard`, `stats`, `calendar`, `profile`, `ui`, `landing`), each following the same `*.types.ts` / `*.api.ts` / `*.thunks.ts` / `*.slice.ts` / `*.selectors.ts` pattern, currently backed by in-memory mock functions with an artificial network delay.

The mock layer was deliberately built with this migration in mind — `auth.api.ts` says so explicitly ("function signatures are designed to stay stable across that migration"). That holds true everywhere: **thunks, slices, selectors, and components should not need to change** for most modules — only the bodies of the `*.api.ts` files (mock logic → real HTTP calls) and a handful of type/shape adjustments called out below.

---

## 1. What has to happen before any module can be wired up (Phase 0)

Right now there is **no HTTP client, no token storage, and no session bootstrap** in the frontend at all — `auth.slice.ts` holds only an in-memory `user` object with no persistence, so a page refresh silently logs the user out (this already happens today with the mock; it just becomes visible once the backend is real). Three things need to exist before any feature module can be touched:

### 1.1 HTTP client (`src/api/httpClient.ts`, new)
- Axios instance, `baseURL` from `import.meta.env.VITE_API_BASE_URL` (new `.env` var, defaulting to `http://localhost:4000`), `withCredentials: true` (required so the browser sends/receives the refresh-token cookie — the backend's CORS config already sets `credentials: true` for this).
- Request interceptor: attach `Authorization: Bearer <accessToken>` from the in-memory access token (see 1.2) to every request.
- Response interceptor: on a `401` from any request *other than* `/auth/refresh` itself, attempt one silent `POST /api/auth/refresh`; on success retry the original request once; on failure, dispatch the logout action and let `ProtectedRoute` redirect. This is what makes the JWT-in-memory / refresh-in-cookie pattern usable without localStorage.
- A typed helper for unwrapping the backend's response envelope (`{ success, message, data }`) and normalizing errors (`{ success: false, message, errors? }`) into a single `ApiError`-like shape thunks can pass to `rejectWithValue`.

### 1.2 Auth state + session bootstrap
- Add `accessToken: string | null` to `AuthState` (`auth.types.ts`). Keep it in Redux (in memory only — never localStorage/sessionStorage per the backend's security model) so the interceptor in 1.1 can read it via `store.getState()`.
- New thunk `bootstrapSessionThunk`: calls `POST /api/auth/refresh` once on app start. If it succeeds (the browser still has a valid httpOnly refresh cookie from a previous session), it populates `user` + `accessToken` without the user re-entering credentials. If it 401s, state stays logged-out. This replaces "logged out on every refresh" with real persistence, using the mechanism the backend already implements — no frontend-side token storage needed.
- `main.tsx` dispatches `bootstrapSessionThunk` once before/alongside rendering (mirroring how `ThemeSync` already runs a startup effect). Add an `authStatus === 'loading'` guard in `ProtectedRoute` so it shows a spinner instead of redirecting to `/login` while the bootstrap call is in flight — right now `ProtectedRoute` reads `selectIsAuthenticated` synchronously and would incorrectly bounce a returning logged-in user to `/login` for one render.

### 1.3 Environment config
- `.env.example` at the frontend root: `VITE_API_BASE_URL=http://localhost:4000`.
- Confirm backend `CORS_ORIGIN` in `backend/.env` matches the Vite dev origin (`http://localhost:5173`) — already the documented default in `backend/.env.example`.

**Nothing else can be meaningfully tested end-to-end until 1.1–1.3 exist.** This is the first PR/branch.

---

## 2. Module-by-module plan

Recommended build order: **Auth → Stats → Routines → Dashboard → Calendar → Profile**. Stats is deliberately second (before the more complex Routines) because its shape was designed to mirror the frontend's `StatsSummary` type field-for-field — it's the fastest way to prove the whole pipeline (client → interceptor → controller → service → DB → back) works before tackling the modules that need real shape adapters.

### 2.1 Auth

| | |
|---|---|
| **Frontend files** | `auth.types.ts`, `auth.api.ts`, `auth.thunks.ts`, `auth.slice.ts`, `LoginPage.tsx`, `RegisterPage.tsx` |
| **Backend endpoints** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |

**Shape differences:** minor. Backend's `User` adds `avatarUrl: string | null` — add it as an optional field to the frontend `User` type. Backend wraps the payload as `{ user, accessToken }`; the mock currently returns a bare `User`, so `loginRequest`/`registerRequest` need to return `{ user, accessToken }` and the thunks/slice need the extra `accessToken` field (already covered by 1.2).

**Work:**
1. Rewrite `loginRequest`/`registerRequest` in `auth.api.ts` to `POST` to the real endpoints via the shared client instead of searching the in-memory `seededUsers` array.
2. Add `logoutRequest()` (currently there's no logout at all in the frontend — `loggedOut` is a synchronous reducer with no API call). Wire it to `POST /api/auth/logout`, then dispatch `loggedOut()`.
3. Extend `auth.slice.ts` to store `accessToken` and handle `bootstrapSessionThunk`'s three states.
4. `LoginPage.tsx`/`RegisterPage.tsx` need no structural changes — they already dispatch `loginUser`/`registerUser` and read `selectAuthError`/`selectAuthStatus`.

**Open decision:** the backend seeds one demo user (`demo@routinemate.app` / `Demo@1234`) via `npm run db:seed`; keep that as the manual QA login until real registration is exercised end-to-end.

### 2.2 Stats

| | |
|---|---|
| **Frontend files** | `stats.api.ts` (only) |
| **Backend endpoint** | `GET /api/stats/summary` |

**Shape differences:** none. `stats.service.ts` on the backend was written to return exactly `StatsSummary` as defined in `stats.types.ts` (`weekly`, `categoryBreakdown`, `trend30Day`, `timeOfDay`, `totalCheckIns`, `completionRate`, `bestStreak`, `activeRoutines`) — this was intentional so this module is close to a drop-in swap.

**Work:** replace the body of `fetchStatsSummary()` with `httpClient.get('/api/stats/summary')`, unwrap `.data.data`. No changes needed to `stats.thunks.ts`, `stats.slice.ts`, `stats.selectors.ts`, or `StatsPage.tsx`.

**Caveat:** the backend summary only has real numbers once habit_logs exist for the logged-in user (the seed data covers the demo user only) — verify against the demo account, not a freshly registered empty account, or expect all-zero charts (which is in fact correct behavior, see `stats.service.ts`'s `emptySummary`).

### 2.3 Routines

| | |
|---|---|
| **Frontend files** | `routines.types.ts`, `routines.api.ts`, `RoutineFormModal.tsx`, `RoutineCard.tsx` (read-only field usage) |
| **Backend endpoints** | `GET /api/routines`, `POST /api/routines`, `GET /api/routines/:id`, `PUT /api/routines/:id`, `DELETE /api/routines/:id`, `PATCH /api/routines/:id/pause`, `POST /api/routines/:id/check-in` |

This is the module with real shape work — the frontend's `Routine` type is a simplified, UI-friendly shape; the backend's is the normalized DB shape. Differences:

| Frontend field | Backend field | Adapter needed |
|---|---|---|
| `frequency: 'Daily' \| 'Mon/Wed/Fri' \| 'Weekdays' \| 'Custom'` | `frequencyType: 'daily'\|'weekdays'\|'specific_days'\|'interval'` + `frequencyConfig: { days?, everyNDays? }` | Yes — two-way mapper. `'Mon/Wed/Fri'` → `specific_days` + `{days:[1,3,5]}`; `'Custom'` → `specific_days`/`interval` depending on what the form collects (see open decision below) |
| `streak` | `currentStreak` | Rename only |
| `status: 'active' \| 'paused'` | `status: 'active'\|'paused'\|'archived'` | Frontend can ignore `'archived'` for MVP-1 (soft-deleted/archived routines shouldn't appear in the active list anyway — `GET /api/routines` supports `?status=active`) |
| `toggleCheckIn(id)` (client-side flip of a boolean + increment/decrement streak) | `POST /:id/check-in` with an explicit `{ status: 'done'\|'partial'\|'skipped'\|'missed' }`, server recomputes the streak from full history | Behavioral change, not just shape — see below |

**The check-in behavior needs a product decision, not just a code change.** The current UI is a single toggle button (`handleToggle` flips `completedToday`). The backend has no "uncheck" — check-in always *records* a status for the day; streak is recomputed authoritatively from `habit_logs`, not incremented/decremented client-side. Two options:
- **(a)** Keep the toggle UI, map "turn on" → `check-in {status:'done'}` and "turn off" → `check-in {status:'skipped'}` (overwrites today's log rather than deleting it — matches the backend's upsert design, no backend change needed).
- **(b)** Expand the UI to let users pick done/partial/skipped/missed explicitly (closer to the backend's actual model, more UI work).
Recommend **(a)** for MVP-1 — it's a same-day upsert either way, ships without backend changes, and (b) can follow later.

**Work:**
1. Add a `routines.mapper.ts` (new file) with `toBackendCreatePayload(input: CreateRoutineInput)` and `fromBackendRoutine(dto): Routine` — keeps the translation logic out of `routines.api.ts` and unit-testable on its own.
2. Rewrite all six functions in `routines.api.ts` to call the real endpoints through the mapper. `toggleCheckIn` becomes `check-in` per the decision above; `togglePause` maps directly to `PATCH /:id/pause` (already a 1:1 match — both are toggle semantics).
3. `routines.types.ts`: widen `RoutineStatus` to include `'archived'` (even if the UI never sets it, `Partial<Routine>` responses could include it), keep `frequency` as the UI type and treat it purely as a display concern produced by the mapper.
4. No changes expected to `RoutineFormModal.tsx` itself if it already collects `frequency` as one of the four label options — the mapper absorbs the translation.

### 2.4 Dashboard

| | |
|---|---|
| **Frontend files** | `dashboard.api.ts` (only) |
| **Backend endpoints** | `GET /api/dashboard/greeting` (used) — `GET /api/dashboard/overview` (available, not required) |

**Shape differences:** none for greeting (`{name, quote}` matches exactly). `DashboardPage.tsx` already derives "Today's Routines", the progress ring, and "Best streak" from the `routines` slice via `selectActiveRoutines` / `selectTodayProgress` / `selectBestStreak` rather than fetching separately — so once Routines (2.3) is wired up, the dashboard's data is correct for free.

**Work:** replace `fetchGreeting`'s body with `httpClient.get('/api/dashboard/greeting')`. **Recommendation: don't wire up `/api/dashboard/overview` for MVP-1** — it would duplicate work the frontend already does client-side from the routines it has to fetch anyway for the Routines page, and adds a second source of truth to keep in sync. Keep it available for a future "server-side dashboard" refactor if the routine list ever gets too large to fetch in full.

### 2.5 Calendar

| | |
|---|---|
| **Frontend files** | `calendar.types.ts`, `calendar.api.ts`, `CalendarPage.tsx` (verify month-navigation props) |
| **Backend endpoint** | `GET /api/calendar?month=YYYY-MM` |

**Shape differences:** the frontend wants a grid-ready shape (`{label: 'August 2026', leadingBlanks: 6, today: 18, days: [{date: 1..31, status}]}`); the backend returns a raw aggregation (`{month: 'YYYY-MM', days: [{date: 'YYYY-MM-DD', status, completed, total}]}`). This needs a display adapter, not a backend change (the backend shape is the more reusable/general one).

**Work:**
1. Add a `toCalendarMonth(dto, referenceDate)` transform in `calendar.api.ts` (or a `calendar.mapper.ts`) that: parses `dto.days[i].date` down to the day number, computes `leadingBlanks` from the weekday of the 1st of the month, sets `today` from the real current date only when the requested month is the current month (otherwise omit/ignore), and builds the human label (`'August 2026'`) from the `YYYY-MM` string.
2. `fetchCalendarMonth()` needs a month parameter now (currently takes none — it's hardcoded to a fixed demo month). Check `CalendarPage.tsx` for whether month navigation UI already exists; if it only shows the current month today, this is a small, contained addition to `calendar.thunks.ts` (`fetchCalendarThunk(month: string)`).

### 2.6 Profile

| | |
|---|---|
| **Frontend files** | `profile.types.ts`, `profile.api.ts`, `profile.thunks.ts`, `profile.slice.ts`, `ProfilePage.tsx` |
| **Backend endpoints** | `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/preferences`, `DELETE /api/profile` |

**Shape differences / gaps:** this module currently has no "fetch on load" at all — `ProfilePage.tsx` seeds its local `name`/`email` state straight from `selectCurrentUser` (the auth slice) and `preferences` defaults to whatever `profile.slice.ts`'s `initialState` is; there's no `GET` thunk. The backend additionally tracks `theme` and `firstDayOfWeek` on `user_preferences`, which today live only in the frontend's `ui.slice` (`theme`) and don't exist at all (`firstDayOfWeek`) on the frontend.

**Work:**
1. Add `fetchProfileThunk` (`GET /api/profile`) dispatched once when `ProfilePage` mounts (same `status === 'idle'` guard pattern already used in `DashboardPage`), populating both `profile.slice` preferences and refreshing `auth.user` (name/email/avatarUrl) from the authoritative source.
2. `updateAccountThunk` → `PUT /api/profile`; `updatePreferencesThunk` → `PUT /api/profile/preferences`. Both are near-identical shape already (`{name, email}` and the two boolean flags respectively) — the backend just accepts a couple of extra optional fields (`avatarUrl`, `theme`, `firstDayOfWeek`) the frontend doesn't send yet, which is fine since they're optional in the zod schema.
3. Add `deleteAccountThunk` (`DELETE /api/profile`) and wire it to the "Delete Account" button, which currently just shows a toast saying deletion is disabled. On success: dispatch `loggedOut()` and navigate to `/`.
4. **Open decision — theme sync scope:** today `ui.slice`'s theme is fully client-side (`localStorage` + `prefers-color-scheme`). Recommend leaving it that way for MVP-1 (zero risk, zero extra requests) and *not* wiring `theme` into `updatePreferencesThunk`'s payload yet, even though the backend supports it — cross-device theme sync is a nice-to-have, not a blocker, and can be added later by simply including `theme: selectTheme(state)` in the preferences payload once desired.

---

## 3. Cross-cutting work (do alongside the modules, not a separate phase)

- **Error handling convention:** every thunk currently does its own `err instanceof Error ? err.message : '...'` fallback. Once real HTTP errors are in play, standardize on the Phase-0 `ApiError`-unwrapping helper so validation errors from zod (`errors: {...}` on 400s) surface consistently instead of a generic message.
- **Logout on hard auth failure:** if the interceptor's one-shot refresh-and-retry (1.1) also fails, the correct behavior is a forced logout + redirect to `/login`, not a silently failed request.
- **Remove mock artifacts:** each `*.api.ts` currently has a `networkDelay` helper and in-memory arrays (`seededUsers`, `routinesDb`, etc.) — these get deleted as each module is migrated, not left dangling.
- **Regression pass on existing tests:** the existing Jest+RTL suite (`*.slice.test.ts`, `RoutinesPage.test.tsx`) mocks each `*.api.ts` module already, per the codebase's own pattern — these should keep passing unmodified once the api layer is swapped, since thunk/slice contracts aren't changing. Re-run `npm test` after each module to confirm before moving to the next.
- **Manual QA path:** `npm run setup` (installs both), `npm run dev` (concurrently runs both — see root `package.json`), then log in as the seeded demo user and walk each page.

---

## 4. Suggested sequencing summary

1. **Phase 0** — HTTP client, session bootstrap, env config. *(blocks everything)*
2. **Phase 1** — Auth (register/login/logout/refresh wired for real).
3. **Phase 2** — Stats (near-zero shape work; validates the full round trip).
4. **Phase 3** — Routines (the real work: mapper, check-in decision).
5. **Phase 4** — Dashboard (mostly free once Routines is done).
6. **Phase 5** — Calendar (display adapter + month param).
7. **Phase 6** — Profile (fetch-on-load, preferences, delete-account).
8. **Phase 7** — Cross-cutting hardening + full regression pass.

Each phase is small enough to be its own PR/branch and independently testable against the already-seeded demo account, without needing later phases to be done first.
