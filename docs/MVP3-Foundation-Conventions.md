# MVP3 Foundation Conventions

## API validation and responses

Continue using Zod schemas through `validate()` for every new route. Successful responses use `{ success: true, message, data }` through `ApiResponse`; operational failures throw `ApiError` and are mapped centrally by `error.middleware.ts`. New list endpoints must return `{ items, meta }`, where `meta` is produced by `paginationMeta()`.

## Loading, empty, retry

Every new frontend slice uses the existing `idle | loading | succeeded | failed` status pattern. Screens must render a loading state, an actionable error with retry, and an explicit empty state. Thunks should use `rejectWithValue` with the backend message and never silently swallow failures.

## Feature flags

Frontend flags live in `src/config/featureFlags.ts` and default to `false`. A flag may be enabled only after its route, API, authorization, tests, and monitoring are ready. Flags are not authorization: Pro and privacy rules must still be enforced by the backend.

## Authorization and privacy

Use `assertOwner()` for resource ownership checks and `canView()` (or a more restrictive policy) for social visibility. Perform filtering server-side before serialization. Never rely on hidden UI controls for access control.

## Pagination

Parse `page` and `pageSize` with `paginationSchema`, cap `pageSize` at 100, use `paginationOptions()` for Sequelize queries, and return `paginationMeta()` alongside items. Prefer stable ordering by `createdAt` plus `id`.

## Migrations

Use timestamped, forward-only Sequelize migrations. Each migration must be reversible, add indexes for foreign keys and common list filters, and avoid destructive data changes without an explicit backfill and rollback plan. Model changes, validators, services, and tests should land in the same vertical slice.

## Audit logs

Record security-sensitive state changes (friendship, privacy, billing, OAuth connection, moderation) with actor, action, resource type/id, timestamp, request correlation id, and minimal metadata. Never log access tokens, refresh tokens, payment details, raw credentials, or private habit content.

## Background jobs

Jobs must be idempotent, bounded, observable, and safe to retry. Follow the existing scheduler isolation pattern: one job failure must not stop other jobs, errors are logged with context, and multi-instance deployment must use a single worker or distributed lock. Store dedupe markers for externally visible work.

## Analytics

Use stable names from `src/analytics/events.ts`. Events contain aggregate or pseudonymous metadata only (for example feature, metric, or outcome); do not send habit titles, journal text, email addresses, calendar tokens, or payment data. Track invitations, challenge participation, Pro funnel, calendar/timer use, insight engagement, and feedback activity.
