# RoutineMate Architecture

**Document status:** Implementation-based architecture overview

**Last reviewed:** 2026-10-26

This document describes the architecture present in the repository, rather than the original MVP design or future product plans. It is intended to help developers understand application boundaries, request/data flow, persistence, integrations, and known operational constraints. For setup commands and environment variables, see the [README](README.md); for Calendar OAuth setup, see [Google Calendar Sync Setup](docs/Google-Calendar-Sync-Setup.md).

## 1. System overview

RoutineMate is a TypeScript full-stack web application organized as a frontend and backend in one repository:

- **Frontend:** React 18, React Router, Redux Toolkit, Axios, and Vite.
- **Backend:** Node.js, Express, TypeScript, Sequelize, and MySQL.
- **Persistence:** MySQL schema is managed by versioned Sequelize migrations; Sequelize models represent persisted domain entities.
- **Authentication:** short-lived bearer access tokens and rotating refresh tokens delivered in an HTTP-only cookie.
- **Deployment shape:** one browser application communicates with one JSON API. The backend also runs a process-local scheduler for notifications, weekly emails, and challenge cleanup.

```text
Browser
  ├── React application (Vite build)
  ├── Redux state + page-local state
  ├── Axios API client ─────────────────────────────┐
  ├── IndexedDB queue for offline routine check-ins  │
  └── app-shell service worker (production)           │
                                                      ▼
                                           Express API (/api)
                                              │
                         auth / validation / controllers
                                              │
                                         services
                                              │
                              Sequelize models and queries
                                              │
                                           MySQL
                                              │
                    ┌─────────────────────────┴─────────────────────┐
                    │                                               │
             Google OAuth/Calendar                         Resend email
             (optional integration)                       (optional)
```

The application is domain-feature-oriented on the frontend and layered on the backend. The feature folders are not independent deployable services: they share a Redux store and API client on the frontend and one Express process and database on the backend.

## 2. Repository map

```text
.
├── src/
│   ├── api/                 # Axios client, auth token store, envelopes, errors
│   ├── app/                 # Store, router, app-wide bridges, install support
│   ├── components/          # Reusable shared UI
│   ├── config/              # Frontend feature switches
│   ├── features/            # Product domains and page-level modules
│   ├── layouts/             # Authenticated application shell
│   ├── offline/             # IndexedDB check-in queue
│   ├── styles/              # Global SCSS and design tokens
│   └── test/                # Jest setup
├── backend/
│   ├── config/              # Sequelize CLI configuration
│   ├── scripts/             # Database bootstrap for dev/start
│   └── src/
│       ├── config/           # Runtime environment and Sequelize connection
│       ├── controllers/      # HTTP request/response handling
│       ├── jobs/             # In-process scheduled sweeps
│       ├── middleware/       # Authentication, validation, errors
│       ├── migrations/       # Database schema history
│       ├── models/           # Sequelize models and associations
│       ├── routes/           # API route groups
│       ├── seeders/          # Development/demo data
│       ├── services/         # Domain logic and provider integrations
│       ├── types/            # Express request augmentation
│       ├── utils/            # Shared backend helpers
│       └── validators/       # Zod input schemas
├── docs/                     # Product scope, prototypes, and setup guides
├── public/                   # PWA manifest, icons, and service worker
├── package.json              # Frontend and root development scripts
└── README.md
```

Frontend product feature folders currently include `achievements`, `auth`, `calendar`, `challenges`, `dashboard`, `feedback`, `friends`, `goals`, `journal`, `landing`, `notifications`, `onboarding`, `profile`, `routines`, `stats`, and `ui`.

## 3. Frontend architecture

### 3.1 Application bootstrap

`src/main.tsx` mounts the React tree under Redux's `<Provider>` and React Router's `<RouterProvider>`. It also mounts three app-wide behaviors:

- `ThemeSync` applies the selected theme to the document.
- `AuthSessionBridge` restores the current session on startup and listens for unrecoverable refresh failures.
- `OfflineSyncBridge` retries queued routine check-ins at startup and on the browser's `online` event.

The PWA install listener is imported early so the browser's `beforeinstallprompt` event can be captured. The service worker is registered only in production; it caches an app shell and same-origin static assets but deliberately bypasses `/api/` requests.

### 3.2 Routing and access control

Routes are declared in `src/app/router.tsx`.

- Public routes: `/`, `/login`, `/register`, and `/roadmap`.
- Authenticated onboarding route: `/onboarding`.
- Other application pages are nested under `AppLayout` and `ProtectedRoute`.
- A catch-all route redirects unknown locations to `/`.

`ProtectedRoute` waits for the initial session bootstrap before redirecting. It also loads onboarding state and routes an authenticated user through onboarding when required. The onboarding-state failure path currently fails open to avoid trapping a user in a redirect loop.

The route guard is a user-experience boundary, not an authorization boundary. The API independently checks bearer tokens and resource ownership.

### 3.3 Feature modules and state ownership

Feature folders co-locate page components, API adapters, TypeScript types, styles, Redux slices/thunks/selectors, and tests where appropriate. Product domains include routines, dashboard, goals, statistics, achievements, calendar, journal, profile, onboarding, authentication, and notifications.

State management is intentionally **hybrid**, rather than every page using Redux:

- Redux Toolkit stores shared application and domain state. Current store slices are `auth`, `ui`, `routines`, `dashboard`, `stats`, `calendar`, `profile`, `landing`, `onboarding`, `goals`, `achievements`, `journal`, and `notifications`.
- Pages with short-lived interaction state (for example form visibility, selected filters, action status, or billing requests) use React component state.
- Several later feature screens and their small API adapters (such as feedback, friends, focus sessions, and parts of challenges/bundles) use page-local state and call the shared HTTP client directly rather than adding a Redux slice.

This avoids globalizing ephemeral UI state, but it means data-fetching conventions and cache lifetime differ between modules. Adding a new shared cross-page domain should include a deliberate choice of local state versus a Redux slice.

### 3.4 API client and authentication lifecycle

`src/api/httpClient.ts` is the shared Axios client. It reads `VITE_API_BASE_URL`, sends credentials for the refresh cookie, and attaches the in-memory access token as a bearer token.

```text
Application startup
  → POST /api/auth/refresh using cookie
  → store returned access token in module memory
  → protected routes resolve

Later API request returns 401
  → one shared refresh request is created for concurrent failures
  → original request is retried with the new access token
  → if refresh fails, clear token and emit session-expired event
  → AuthSessionBridge clears authenticated Redux state
```

The access token is not persisted to local storage. Persistence across page reloads comes from the HTTP-only refresh-token cookie. API success responses use `{ success, message, data }`; `src/api/apiResponse.ts` provides an `unwrap` helper for Axios responses.

### 3.5 Offline and installable behavior

Offline support is deliberately narrow:

- `public/sw.js` caches the application shell and static same-origin assets. It does not cache API responses and does not intercept API requests.
- A failed routine check-in can be stored in IndexedDB (`routinemate-offline`, `checkin-queue`).
- The queue stores the latest pending status per routine, ordered by queue time, and the app bridge retries entries when connectivity returns.
- The online badge reflects the browser's `navigator.onLine` state. It is not an active probe of API or database availability.
- Install support uses the browser's native PWA install prompt when the browser exposes it.

This is not a general offline-first application: most API-backed pages need connectivity, and their responses are not cached by the service worker.

### 3.6 Styling, aliases, and build

SCSS Modules scope feature and component styles; `src/styles/global.scss` and its variables/mixins provide global styles and design tokens. Vite and TypeScript configure aliases such as `@features/*`, `@components/*`, and `@api/*`. Jest has matching alias mappings and redirects the Vite environment module to a Jest-specific implementation.

## 4. Backend architecture

### 4.1 Process startup and request pipeline

`backend/src/server.ts` verifies the database connection, creates the Express application, starts listening, and starts the process-local notification scheduler. `backend/src/app.ts` exports an app factory and configures middleware and routes.

The request pipeline is:

```text
HTTP request
  → Helmet
  → credentialed CORS for configured frontend origin
  → JSON / URL-encoded body parsing and cookie parsing
  → Morgan request logging outside production
  → /health or /api route
  → route-level authentication and Zod validation
  → controller
  → service
  → Sequelize model / MySQL
  → shared success envelope or centralized error response
```

`asyncHandler` forwards rejected async handlers to the centralized error middleware. The not-found middleware runs after application routes. `/health` reports API process health; it does not represent an end-to-end check of every external integration.

### 4.2 Layer responsibilities

- **Routes** define HTTP methods, path groups, authentication policy, and validation middleware.
- **Middleware** verifies JWT access tokens, validates request data, and standardizes errors.
- **Controllers** translate request inputs into service calls and HTTP responses.
- **Services** own domain rules, database operations, transactions, and provider calls.
- **Models** define persisted attributes and Sequelize associations.
- **Migrations** are the source of truth for incremental schema changes; seeders create demo data.

Not every legacy or newer endpoint follows an identical amount of validation. Most write operations use Zod validators, but route-level validation should be checked when adding endpoints rather than assumed globally.

### 4.3 API route groups

The backend mounts route groups beneath `/api`:

| Group                                 | Representative responsibilities                                       |
| ------------------------------------- | --------------------------------------------------------------------- |
| `/auth`                               | Registration, password login, Google sign-in, refresh, logout         |
| `/dashboard`                          | Greeting and overview data                                            |
| `/routines`                           | Routine CRUD, history, pause/privacy, check-ins                       |
| `/calendar`                           | Routine activity by month; Calendar sync routes are also mounted here |
| `/calendar-sync`                      | Google OAuth callback, connections, sync, disconnect, conflicts       |
| `/focus-sessions`                     | Start, update, complete, and summarize focus sessions                 |
| `/goals`                              | Goal CRUD and progress updates                                        |
| `/stats`                              | User statistics summary                                               |
| `/achievements`                       | Achievement/XP state                                                  |
| `/journal`                            | Entry list, lookup by date, create/update                             |
| `/profile`                            | Profile, preferences, account deletion                                |
| `/onboarding`                         | Onboarding state and completion                                       |
| `/notifications`                      | List, mark read, and snooze                                           |
| `/friends`, `/users`, `/leaderboards` | Friend requests, user lookup/public profile, friend ranking           |
| `/routine-bundles`                    | Bundle CRUD, ordered items, bundle check-ins                          |
| `/challenges`                         | Discovery, membership, check-ins, reactions, leaderboard              |
| `/insights`                           | Weekly insight retrieval and feedback                                 |
| `/feedback`                           | Idea listing/creation, votes, and status                              |
| `/roadmap`                            | Public roadmap list                                                   |
| `/billing`                            | Subscription status, checkout/portal actions, webhook                 |

Authentication is applied at route-group or endpoint level; public exceptions include the public roadmap and the Google Calendar OAuth callback. Check the individual route module for the exact policy and validators.

### 4.4 API response and errors

Successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Errors use `success: false` with a message and optional details. Zod and Sequelize validation errors become client errors; unknown errors are logged and returned as a generic server error. In non-production mode, the backend may include a stack trace in the response.

## 5. Authentication and security boundaries

### 5.1 Session model

The backend issues a short-lived access JWT and a longer-lived refresh JWT. Refresh tokens are sent in an HTTP-only cookie; a hash of each refresh token is stored in `refresh_tokens` so tokens can be rotated and revoked without storing the raw token in the database.

The refresh endpoint verifies the JWT and matching database row, rejects revoked/expired tokens, revokes the presented token, and issues a new pair. Logout revokes the refresh token when supplied. The frontend silently refreshes once for concurrent 401 responses.

### 5.2 Identity and authorization

`requireAuth` verifies the bearer access token and attaches the verified subject to the request. Services/controllers use that user ID to scope most personal data. Public/social resources have additional privacy and membership rules that are implemented in their domain services.

Frontend route protection improves navigation but must not be relied on to protect data. Backend authentication and per-resource authorization remain authoritative.

### 5.3 Security controls and review points

Implemented controls include bcrypt password hashing, JWT verification, refresh-token hashing and rotation, Helmet, credentialed CORS restricted to a configured origin, Zod validation on many routes, encrypted Google Calendar token storage, and ORM parameterization.

Operational controls that should be assessed before public production deployment include request rate limiting and abuse controls, deployment-specific cookie settings and HTTPS, secret rotation, backup/restore procedures, and multi-instance job coordination. Avoid assuming that CORS or frontend route guards replace server-side authorization.

## 6. Persistence and domain model

MySQL is accessed through a shared Sequelize instance configured with `utf8mb4`, underscored table/column naming, timestamps, and a connection pool. Schema evolution is migration-based; model definitions alone do not migrate a database.

### 6.1 Persisted domains

Models currently cover:

- **Identity:** users, preferences, refresh tokens, onboarding state.
- **Habit tracking:** routines and habit logs.
- **Progress:** goals, milestones, achievements, user achievement unlocks, and user XP.
- **Reflection and communication:** journal entries and notifications.
- **Social:** friendships, challenges, challenge check-ins, challenge reactions, and leaderboards derived from friend/challenge data.
- **Sequencing:** routine bundles, ordered bundle items, and bundle check-ins.
- **Focus:** focus sessions.
- **Integrations:** Calendar connections and one-time OAuth states.
- **Feedback and insights:** feedback items, votes, and weekly insight records.
- **Billing records:** subscriptions and billing events.

The Sequelize association graph includes user-owned routines, logs, goals, preferences, refresh tokens, journal entries, notifications, social records, bundles, subscriptions, and related progress records. Cascading delete behavior is configured for a number of user-owned relationships; review the specific model and migration when changing retention or deletion semantics.

### 6.2 Database operations

The Sequelize CLI configuration is in `backend/config/config.js`; models and migrations live under `backend/src/`. Migration history is tracked by Sequelize in the database. Seeders contain demo users, routines, logs, and later MVP sample data.

The backend's `predev` and `prestart` scripts execute `backend/scripts/bootstrap.js`: apply pending migrations, check whether the users table contains data, seed if it appears empty, and then start the server. This is convenient for development but couples server startup to database migration and demo-seed behavior. Production deployment should use an explicit reviewed migration step and must avoid unintended demo data seeding.

## 7. Integrations and scheduled work

### 7.1 Google sign-in

The frontend obtains a Google credential and submits it to `/api/auth/google`. The backend verifies token information against the configured sign-in `GOOGLE_CLIENT_ID`, creates or finds the local user, and issues RoutineMate's own token pair. This sign-in client ID is separate from the Calendar OAuth client ID.

### 7.2 Google Calendar export

Calendar sync is a user-triggered **one-way export**, not a two-way calendar integration:

1. An authenticated user requests a Google connection URL; the backend validates the browser time zone and persists a short-lived OAuth nonce.
2. The backend signs state and sends the browser to Google using the configured Calendar OAuth web client.
3. The unauthenticated provider callback verifies signed state and consumes the matching nonce exactly once before exchanging the authorization code.
4. Access and refresh tokens are encrypted before they are stored in `calendar_connections`.
5. On **Sync now**, the service finds eligible active routines with time-based reminders, creates/updates RoutineMate-managed recurring events, and removes stale managed events.
6. Expired access tokens are refreshed; disconnect attempts provider revocation and removes the saved connection.

RoutineMate does not read unrelated Calendar events, import events, or sync in the background. Google Cloud configuration, the exact backend callback URI, encryption secret, and database migrations are required. Detailed steps are in the [Calendar setup guide](docs/Google-Calendar-Sync-Setup.md).

### 7.3 Email and notification scheduler

At backend startup, `startNotificationScheduler()` starts a 60-second `setInterval`. Each tick runs notification generation, weekly email delivery, and expired-challenge archiving. Weekly email uses Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured; otherwise mail delivery is skipped with a log warning.

This scheduler runs inside each API process. It is appropriate for a single-instance development deployment, but multiple API replicas can execute duplicate sweeps. Production horizontal scaling should move scheduled work to a designated worker or distributed job/locking mechanism.

### 7.4 Insights

The current weekly insight service creates deterministic summaries and suggestions and persists them. It does not call an AI/LLM provider. The AI-related feature flag should not be interpreted as evidence that an external model integration exists.

### 7.5 Billing

Subscription records and API endpoints for status, checkout, portal, and webhooks exist. However, the current checkout/portal service returns local placeholder URLs when the Stripe secret is present; it does not create a real Stripe Checkout Session or Customer Portal session. Billing is therefore not a complete production payment integration.

## 8. Configuration and runtime environments

Configuration is split across:

- Root `.env`: Vite-exposed variables such as `VITE_API_BASE_URL`, Google sign-in client ID, and declared `VITE_FEATURE_*` switches.
- `backend/.env`: server port, MySQL, JWT secrets, CORS origin, optional Google Calendar, Resend, and Stripe values.

Only variables prefixed with `VITE_` are intended to be exposed to the browser. Provider secrets, JWT signing secrets, and database credentials belong only in the backend environment and deployment secret store.

Feature flags are declared in `src/config/featureFlags.ts` and default to false when not set to the exact string `true`. They are not yet applied uniformly across all feature routes and services; inspect each feature's usage before treating a flag as a complete security or rollout boundary.

Useful defaults for local development are Vite at port `5173`, the API at port `4000`, and MySQL at port `3306`. Actual values are controlled by environment configuration. The API has a `/health` endpoint.

## 9. Testing and quality architecture

- Frontend: Jest with jsdom, React Testing Library, and `src/test/setupTests.ts`. Tests are co-located under feature `__tests__` directories. CSS modules are mocked, and Vite aliases are mapped for Jest.
- Backend: Jest with the Node environment and ts-jest. Tests are primarily co-located under backend modules; Supertest is available for HTTP-level tests.
- Static quality: TypeScript strict settings, ESLint, and Prettier are configured separately for root frontend and backend.
- Database migrations and seeders are generally not exercised by unit tests; migration correctness should also be verified against a representative MySQL instance.

There is no claim here of comprehensive browser end-to-end coverage, load testing, or production observability. Those should be established as separate release requirements if needed.

## 10. Architectural assessment

### Strengths

- Clear frontend feature organization and backend route/controller/service/model separation.
- Shared typed API client, response envelope, and refresh lifecycle reduce repeated transport/auth code.
- Database schema changes are versioned and associations are explicit.
- Sensitive refresh tokens are not persisted raw in the database; Calendar provider tokens are encrypted at rest.
- Tests cover important domain logic and selected user-visible flows.
- Offline behavior is constrained to an explicit retryable check-in queue rather than serving stale API data as if current.

### Constraints and risks to manage

- **State management is mixed:** some domains have Redux slices while newer screens use page-local state and direct API calls. Establish a consistent policy as cross-page data sharing grows.
- **Single-process background jobs:** the scheduler can duplicate work when the API is scaled horizontally.
- **Rollout switches are partial:** feature flags are not comprehensive route or backend gates.
- **Offline scope is narrow:** only routine check-ins are queued; most screens require a working API.
- **Provider integrations differ in completeness:** Calendar export is implemented but requires OAuth setup; billing endpoints are placeholders; insights are deterministic.
- **Startup side effects:** dev/start bootstrap migrates and may seed data. Separate release migrations from application startup before production use.
- **Operational hardening remains deployment-specific:** rate limiting, observability, backups, secret management, and high-availability job scheduling need explicit configuration/processes.
- **Schema and service complexity are growing in a shared MySQL database:** maintain domain ownership, transaction boundaries, constraints, and migration review as features expand.

These are implementation and deployment observations, not a claim that every item is currently a defect. Reassess them against the intended deployment scale and threat model.

## 11. Recommended change workflow

For a new domain feature:

1. Define the persisted data and migration first; include ownership, uniqueness, deletion, and index behavior.
2. Add or update Sequelize models/associations and domain service logic.
3. Add Zod input validation, route authentication, controller mapping, and response/error behavior.
4. Add a frontend feature API adapter and choose Redux state only when data needs to be shared or cached across screens.
5. Add user-visible loading, empty, error, and retry states, plus accessibility labels.
6. Test business rules and API boundaries; add UI tests for important interactions.
7. Run migrations and tests against the intended database/runtime configuration; update this document and the README when architecture or setup changes.

## 12. Related documentation

- [Project README and local setup](README.md)
- [Google Calendar Sync Setup](docs/Google-Calendar-Sync-Setup.md)
- [Database design](docs/RoutineMate-MVP1-Database-Design.html)
- [Frontend/backend integration plan](docs/RoutineMate-Frontend-Backend-Integration-Plan.md)
- [MVP-2 scope](docs/RoutineMate-MVP2-Scope.md)
- [MVP-3 scope](docs/RoutineMate-MVP3-Scope.md)
