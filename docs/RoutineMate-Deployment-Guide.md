# RoutineMate Deployment Guide

This guide covers a production deployment of the RoutineMate frontend and API as separate services, backed by MySQL. It is provider-neutral; use the equivalent settings on your static-site host, Node.js host, and managed database provider.

> **Deployment is not just a successful build.** Before a public launch, complete the production configuration, credential rotation, database backup/migration, and smoke tests below. See [Release checklist](#release-checklist) and [Known deployment limitations](#known-deployment-limitations).

## 1. Deployment shape

Recommended setup:

- **Frontend:** static HTTPS hosting for the generated `dist/` directory.
- **Backend:** a long-running Node.js service running the compiled Express API.
- **Database:** managed MySQL 8 or compatible MySQL service, with TLS/private networking where supported.
- **Domains:** preferably use the same site for the frontend and API, such as `app.example.com` and `api.example.com`, or proxy `/api` through the frontend domain. The API uses an HTTP-only refresh cookie with `SameSite=Lax`; unrelated cross-site frontend/API domains may prevent that cookie from working as expected.

The frontend is a Vite single-page application. Configure the static host to serve `index.html` for client-side routes such as `/dashboard` and `/profile`, while serving real static files normally. Do not rewrite API requests to the SPA.

## 2. Prerequisites

- Node.js 20 or newer and npm.
- MySQL 8 or newer.
- A production frontend origin and API origin served over HTTPS.
- A database backup and a controlled migration/release process.
- Provider accounts and credentials only for integrations you intend to enable.

Use separate production credentials and a separate production database. Never copy demo or local-development database data into production.

## 3. Configure production environment

Create environment variables in the deployment platform’s secret/configuration manager. Do not commit production `.env` files or put backend secrets in frontend variables.

### Frontend build variables

Vite embeds `VITE_*` variables into the generated JavaScript at **build time**. Set them in the frontend build environment before `npm run build`.

| Variable                | Required                     | Production value                                                                                                                                               |
| ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | Yes                          | API origin, without a trailing slash, e.g. `https://api.example.com`. For a same-origin reverse proxy, use the configured public API base expected by the app. |
| `VITE_GOOGLE_CLIENT_ID` | If Google sign-in is enabled | Google OAuth web client ID registered for the deployed site.                                                                                                   |
| `VITE_FEATURE_*`        | Optional                     | Keep unfinished or unverified product features disabled. These are not a substitute for backend authorization or feature gating.                               |

The checked-in `.env.example` is for local development. In particular, its API URL points to localhost; it is not a production frontend configuration.

### Backend environment variables

Set at least the following on the API service:

| Variable                                                                                     | Required                       | Production notes                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                                   | Yes                            | Set to `production`. This enables production cookie security and disables SQL logging.                                                   |
| `PORT`                                                                                       | Usually supplied by host       | Listen on the port supplied by the host (default is `4000`).                                                                             |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`                                    | Yes                            | Use the production database and a least-privileged application account. Do not use the root account.                                     |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                                    | Yes                            | Use separate, high-entropy secrets. Keep stable across API restarts and replicas; changing them invalidates existing sessions/tokens.    |
| `CORS_ORIGIN`                                                                                | Yes                            | Exact browser frontend origin, including scheme and port, with no path. The API currently accepts one configured origin and credentials. |
| `CALENDAR_TOKEN_ENCRYPTION_KEY`                                                              | If Calendar OAuth is enabled   | Generate and store a stable, dedicated secret. Preserve it for as long as encrypted provider tokens must remain readable.                |
| `GOOGLE_CLIENT_ID`                                                                           | If Google sign-in is enabled   | Backend verification client ID; configure it for the production OAuth application.                                                       |
| `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI` | If Calendar sync is enabled    | Register the exact HTTPS callback URL with Google. See [Google Calendar Sync Setup](./Google-Calendar-Sync-Setup.md).                    |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                               | If email is enabled            | Use a production API key and sender/domain verified with the email provider.                                                             |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`                          | Only if billing is operational | Configure only after completing provider-side setup and verifying the billing flows. See limitations below.                              |

Generate separate random secrets, for example:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Store the first output as `JWT_ACCESS_SECRET`, the second as `JWT_REFRESH_SECRET`; do not reuse them for database passwords, OAuth client secrets, or encryption keys. Use your platform’s secret manager rather than printing values into CI logs.

The runtime currently supplies development-oriented defaults for some database and CORS settings. Explicitly set all production values rather than relying on defaults.

## 4. Prepare and migrate the database

1. Provision a production MySQL database with `utf8mb4` support and network access restricted to the API/release environment.
2. Create a dedicated database user with only the permissions required by the application and schema migrations.
3. Take a restorable backup before the initial migration and before every later migration.
4. Set the **production** backend environment variables in the release/migration job.
5. From the repository root, install backend dependencies and apply migrations:

   ```bash
   npm ci --prefix backend
   npm --prefix backend run db:migrate
   ```

6. Run migrations once per release, as a serialized deployment/release step—not from every API replica.
7. **Do not run seeders in production.** Seeders create demo accounts and sample data.

The backend’s `npm start` lifecycle currently invokes `prestart`, which runs `backend/scripts/bootstrap.js`. That script applies migrations **and seeds an empty database**. Do not use `npm start` for a production launch until that behavior is changed. Use the direct compiled entry point described below. The same bootstrap is also attached to `npm run dev`; do not use the development command in production.

## 5. Build and deploy the backend

Build the API from the repository root:

```bash
npm ci --prefix backend
npm run build --prefix backend
```

Run the server with `backend/` as its working directory:

```bash
cd backend
NODE_ENV=production node dist/server.js
```

In a hosted environment, configure the start command as `node dist/server.js` and working directory as `backend/`, while supplying the environment variables through the platform. Do not add the `npm start` lifecycle hook unless the bootstrap script has first been made production-safe.

The service should bind to the platform-provided `PORT`. Expose `/health` through the host’s health-check configuration; it reports API process health, not database readiness after startup. The API verifies the database connection before listening.

### Backend scaling and scheduler

The server starts an in-process notification/email/challenge scheduler on boot. Running multiple API replicas will run the scheduler on every replica and can cause duplicate sweeps or sends. Until the scheduler is moved behind a distributed lock or dedicated worker, run **one API replica**. Do not scale API replicas horizontally without addressing this.

## 6. Build and deploy the frontend

From the repository root, set the production `VITE_*` build variables in the build environment, then run:

```bash
npm ci
npm run build
```

Publish the resulting root `dist/` directory as the static site. Do not publish the repository root or backend build output as the frontend.

Configure the static host:

- Serve over HTTPS.
- Enable SPA history fallback to `/index.html` for application routes.
- Keep `/assets/*`, `/manifest.webmanifest`, `/sw.js`, and icons served as static files with correct content types.
- Do not cache `index.html` for a long time; hashed Vite assets can use long-lived immutable caching.
- Make sure the service worker at `/sw.js` is served from the site root and is not rewritten to `index.html`.

If `VITE_API_BASE_URL` or another Vite variable changes, rebuild and redeploy the frontend; changing runtime host environment variables alone does not update an already-built static bundle.

## 7. HTTPS, cookies, CORS, and OAuth

- Use HTTPS for both frontend and API. Production refresh cookies are marked `Secure` by the API.
- `CORS_ORIGIN` must exactly match the browser origin, for example `https://app.example.com`, not the API origin and not a wildcard.
- The frontend HTTP client sends credentials for refresh-cookie requests. Keep credentialed CORS enabled and do not change it to `Access-Control-Allow-Origin: *`.
- Prefer frontend/API subdomains under the same registrable domain or a same-origin reverse proxy because the refresh cookie uses `SameSite=Lax`.
- Set production Google OAuth authorized origins and redirect URIs. For Calendar, register the exact `GOOGLE_CALENDAR_REDIRECT_URI`, which must match the deployed API callback route.
- Keep OAuth secrets, JWT keys, database credentials, email keys, and payment secrets exclusively on the backend.

## 8. PWA and offline behavior

The production frontend registers `/sw.js`; local Vite development does not. The service worker caches the shell and static assets and intentionally does not cache API responses. The app manifest starts at `/dashboard`.

After deployment, verify:

1. `/manifest.webmanifest`, `/sw.js`, and `/pwa-icon.svg` return successful responses at the site root.
2. The service worker installs without scope or MIME-type errors.
3. Direct navigation and refresh on `/dashboard` and another nested route work.
4. Install behavior on supported browsers and the platform-specific manual install flow on browsers without `beforeinstallprompt`.
5. Offline shell behavior and queued check-in synchronization after reconnecting.

Test installability in a real HTTPS deployment; localhost development behavior is not representative. The manifest currently uses SVG icons only, so verify target browser install requirements and add standard raster sizes if required by your target platforms.

## 9. Release verification

Run checks in CI before promotion:

```bash
npm run build
npm test -- --runInBand
npm run format:check
npm run lint
npm run build --prefix backend
npm test --prefix backend -- --runInBand
npm run format:check --prefix backend
npm run lint --prefix backend
```

Then verify in the deployed environment:

- `GET https://<api-host>/health` returns HTTP 200.
- Frontend loads, and refreshing `/dashboard` does not return a host-level 404.
- Registration/login, token refresh across reload, logout, and a protected API request work.
- The browser sets and sends the refresh cookie; there are no CORS or cookie warnings.
- A database-backed create/update/read operation succeeds using the production schema.
- PWA manifest and service worker are valid; install and offline behavior are checked on target devices.
- Configured email/OAuth integrations work with production provider credentials; otherwise keep those features disabled or clearly unavailable.
- Logs and monitoring show no startup, migration, database, or unhandled runtime errors.

Use a staging environment with production-like HTTPS, cookie, CORS, OAuth, and database settings before promoting a release.

## 10. Backups, rollback, and operations

- Automate database backups and periodically verify restoration to a separate environment.
- Use expand/contract migrations: add compatible schema first, deploy code that can work with both forms, then remove obsolete schema in a later release.
- A code rollback does not necessarily roll back a database migration. Prefer a forward corrective migration unless the migration is explicitly tested as reversible and restoring data is safe.
- Keep previous frontend assets available during rollout so clients loading an older `index.html` can still retrieve its hashed assets.
- Monitor API health, database connectivity, error rates, email delivery, and disk/memory usage. Do not log passwords, access/refresh tokens, cookies, OAuth authorization codes, or provider secrets.
- Revisit database pool capacity and the scheduler design before increasing API replicas.

## Known deployment limitations

- The production `npm start` script is unsafe for deployment because of its `prestart` database bootstrap/seeding lifecycle. Use `node dist/server.js` as described until startup scripts are corrected.
- The in-process scheduler is single-instance only; multi-replica operation risks duplicate jobs.
- The frontend currently emits a large initial JavaScript chunk. The production build has reported a roughly 1.1 MB minified main chunk (about 358 KB gzip); consider route-level lazy loading and deferring charts/PDF export code.
- Several feature switches are not uniformly enforced across all routes. A frontend flag is not a security boundary; verify feature access on both frontend and backend before enabling a feature.
- README documentation notes that real Stripe Checkout/Customer Portal behavior is not complete. Do not advertise real billing solely because Stripe variables are present.
- The language setting is only partially localized. Do not claim the complete UI is translated until remaining strings, errors, dialogs, and formatting have been handled.
- Run the repository’s full frontend and backend test/lint commands and resolve any failures before release. A successful type-check or build by itself is not a production-readiness sign-off.

## Release checklist

- [ ] Production secrets stored in the hosting secret manager and rotated if previously exposed.
- [ ] Separate production database, least-privileged DB user, and verified backup/restore.
- [ ] Production environment values explicitly set; no localhost URLs or example credentials.
- [ ] Database migrations reviewed, backed up, and applied once as a release step.
- [ ] No demo seeders run against production.
- [ ] Backend launched with `node dist/server.js`, not the unsafe `npm start` lifecycle.
- [ ] API running one replica while the in-process scheduler remains enabled.
- [ ] Frontend built with the production API URL and published with SPA fallback.
- [ ] HTTPS, credentialed CORS, refresh-cookie behavior, and OAuth callbacks verified.
- [ ] CI build, tests, lint, and format checks pass.
- [ ] Authentication, health check, core database flows, PWA, and integrations smoke-tested.
- [ ] Monitoring, backups, rollback plan, and incident contact are in place.
