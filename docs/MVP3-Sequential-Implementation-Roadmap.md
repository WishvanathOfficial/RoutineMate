# RoutineMate MVP3 — Sequential Implementation Roadmap

**Baseline:** MVP2 complete  
**Primary reference:** `docs/MVP3-Functionality-Gap-Report.md`

This roadmap uses vertical slices: each phase should be completed across database, API, frontend UI, integration, authorization, and tests before dependent work begins.

## Phase 0 — MVP3 foundation

Complete before feature development:

- Confirm the MVP2 regression baseline.
- Standardize API validation, errors, loading, empty, and retry states.
- Add feature flags for unfinished MVP3 modules.
- Add reusable authorization/policy helpers and pagination patterns.
- Begin extracting frontend strings for localization.
- Define privacy-conscious analytics event names.
- Establish migration, audit-log, and background-job conventions.

**Gate:** existing MVP2 routes and tests pass unchanged.

## Phase 1 — Friends and privacy

This is the prerequisite for social features.

### Backend

Add `Friendship`, invite-token support, and habit visibility (`private`, `friends`, `public`). Implement:

```text
GET    /api/friends
POST   /api/friends/requests
PATCH  /api/friends/requests/:id
DELETE /api/friends/:id
GET    /api/users/search
GET    /api/users/:id/public-profile
PATCH  /api/routines/:id/privacy
```

Add friendship lifecycle validation, server-side privacy filtering, abuse/rate limits, and indexed queries.

### Frontend

Add `/friends` with friends list, user search, pending requests, accept/reject/remove actions, invite link, and friend profile. Add privacy controls to routine settings and update the sidebar/navigation.

### Integration and tests

Test friendship state transitions, unauthorized access, privacy filtering, invite expiry, and routine visibility changes.

**Gate:** privacy tests pass before Challenges or Leaderboards are started.

## Phase 2 — Group challenges

### Backend

Add `Challenge`, `ChallengeParticipant`, `ChallengeCheckIn`, `ChallengeReaction`, and `ChallengeComment` models/migrations. Implement:

```text
GET    /api/challenges
POST   /api/challenges
GET    /api/challenges/:id
POST   /api/challenges/:id/join
POST   /api/challenges/:id/leave
POST   /api/challenges/:id/check-ins
GET    /api/challenges/:id/feed
POST   /api/challenges/:id/reactions
POST   /api/challenges/:id/comments
```

Support public/private challenges, date validation, participant permissions, invite links/email, shared progress, notifications, and achievement-badge integration. Use polling or websockets for progress refresh.

### Frontend

Add `/challenges` and `/challenges/:id`. Build browse, active/completed tabs, create flow, join/leave, participant progress, feed, reactions/comments, invite, and all loading/empty/error states.

### Integration and tests

Test permissions, duplicate check-ins, date boundaries, achievement unlocks, feed pagination, and refresh behavior.

## Phase 3 — Leaderboards

### Backend

Add a privacy-safe endpoint such as:

```text
GET /api/leaderboards?metric=streak&scope=friends
```

Support current streak, weekly consistency, and total check-ins; include metric/time-window validation, ties, pagination, caching, and friend-only filtering.

### Frontend

Add a leaderboard section to `/friends` with metric selector, ranking list, user rank, profile links, and refresh/error states.

**Gate:** no private habit data or private users can be inferred through rankings or totals.

## Phase 4 — Routine bundles

### Backend

Add `RoutineBundle`, `RoutineBundleItem`, and `BundleCheckIn`. Implement:

```text
GET    /api/routine-bundles
POST   /api/routine-bundles
GET    /api/routine-bundles/:id
PATCH  /api/routine-bundles/:id
DELETE /api/routine-bundles/:id
POST   /api/routine-bundles/:id/check-ins
```

Support ordered habits, guided sequence completion, individual completion, bundle streaks, and deleted/paused routine handling.

### Frontend

Add `/routines/bundles/new` with routine selection/reordering, guided sequence player, skip/complete controls, bundle progress/streak, and dashboard integration.

## Phase 5 — Billing and Pro entitlements

Implement billing before gating features.

### Backend

Add `Subscription` and `BillingEvent`. Implement Stripe Checkout/Portal, customer creation, signed and idempotent webhooks, cancellation/downgrade, and entitlement middleware:

```text
POST /api/billing/checkout
GET  /api/billing/subscription
POST /api/billing/portal
POST /api/billing/webhook
```

Keep tracking, streaks, and basic stats free as promised. Gate only explicitly selected growth features.

### Frontend

Add upgrade flow and Billing section in Profile: current plan, upgrade, manage subscription, cancellation, payment failure, Pro badges, and locked-feature explanations.

## Phase 6 — Focus timer

### Backend

Add `FocusSession` and implement:

```text
POST /api/focus-sessions
PATCH /api/focus-sessions/:id
POST /api/focus-sessions/:id/complete
GET  /api/focus-sessions/summary
```

Define start/pause/resume semantics, duration validation, idempotent completion, and accumulated-time summaries.

### Frontend

Build timer UI with countdown, start/pause/resume, complete/cancel, selected habit, history, totals, and then desktop quick-timer support.

## Phase 7 — Calendar synchronization

### Backend

Add `CalendarConnection` with encrypted provider tokens. Implement Google OAuth, Apple Calendar strategy, refresh/revoke, event create/update/delete, conflict detection, sync jobs, and retries:

```text
GET  /api/calendar/connections
GET  /api/calendar/connect/google
POST /api/calendar/disconnect
POST /api/calendar/sync
GET  /api/calendar/conflicts
```

Never store provider tokens in frontend storage.

### Frontend

Extend `/calendar` with connect/disconnect, connection status, sync settings, routine scheduling, conflict warnings, and recovery states.

## Phase 8 — AI-generated insights

### Backend

Add `Insight`. Build a weekly batch job, provider abstraction, prompt/version tracking, per-user generation limits, cost budget, deterministic fallback, failure logging, and data minimization:

```text
GET  /api/insights
POST /api/insights/:id/feedback
```

AI failure must never block the Stats page.

### Frontend

Extend Stats with an AI Insights card, weekly summary, suggestions, explanation, Pro gating if selected, and loading/fallback/error states. Track viewed and acted-on events.

## Phase 9 — Feedback and public roadmap

### Backend

Add `FeedbackItem` and voting. Implement:

```text
GET    /api/roadmap
GET    /api/feedback
POST   /api/feedback
POST   /api/feedback/:id/votes
DELETE /api/feedback/:id/votes
PATCH  /api/feedback/:id/status
```

Prevent duplicate votes and restrict status changes to authorized moderators.

### Frontend

Add public `/roadmap` and private `/feedback` with roadmap statuses, suggestion form, voting, filters, moderation-friendly states, and community links.

## Phase 10 — Localization

### Backend

Store language preference and keep dates machine-readable. Localize user-facing errors where needed.

### Frontend

Add `/settings/language`, translation catalogs, lazy loading, locale-aware dates/times, first-day-of-week, metric/imperial units, and translated validation/empty states.

Begin string extraction in Phase 0; finish after new MVP3 UI strings stabilize.

## Phase 11 — Production hardening

Before declaring MVP3 complete:

- Run all frontend/backend tests and add API integration tests for every new route.
- Add end-to-end tests for signup, invite, challenge, bundle, billing, timer, calendar, and insight flows.
- Verify responsive behavior, accessibility, and browser compatibility.
- Add rate limits for social, feedback, OAuth, and billing endpoints.
- Add webhook/OAuth audit logs, monitoring, retries, and alerts.
- Test backups, restore, deletion, export, privacy, and entitlement bypass scenarios.
- Verify background jobs and provider failure recovery.
- Instrument the success metrics defined in the MVP3 scope.

## Dependency order

```text
Foundation
   ↓
Friends + Privacy
   ↓
Challenges
   ↓
Leaderboards

Routine Bundles ─────────────┐
                             ↓
Billing + Entitlements → Focus Timer → Calendar Sync
                             ↓
                         AI Insights

Feedback + Roadmap ───────── parallel
Localization ─────────────── gradual, complete near release
```

## First execution sprint

Build the Foundation plus the Friends/privacy vertical slice: migrations/models, policy tests, friendship APIs, frontend route, routine visibility controls, sidebar updates, and contract/integration tests. Do not begin Challenges until the privacy and authorization gates pass.
