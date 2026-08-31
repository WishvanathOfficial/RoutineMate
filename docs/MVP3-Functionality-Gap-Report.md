# RoutineMate MVP3 Functionality Gap Report

**Baseline:** MVP2 complete  
**Compared against:** `docs/RoutineMate-MVP3-Scope.md` and `docs/RoutineMate-MVP3-Prototype.html`  
**Assessment date:** 2026-08-31

## Executive summary

MVP2 is treated as the completed baseline: onboarding, goals, achievements/XP, journal and mood tracking, notifications, PWA/offline behavior, calendar view, statistics, exports, and weekly email functionality are considered available. The current production code has no MVP3 domain implementation yet. The MVP3 prototype is a clickable product concept, not evidence of backend functionality; its Challenges, Friends, Bundles, Focus Timer, AI Insights, Feedback/Roadmap, Billing, and Language screens are static UI demonstrations.

MVP3 should therefore be planned as a new set of vertical slices (database → API → frontend → authorization/entitlements → tests), with Friends/privacy before any social feature and Billing before Pro gates.

## Current MVP2 baseline confirmed in code

| Area                                        | Current implementation                                                 | MVP3 implication                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Core routines, check-ins, streaks           | `src/features/routines`, `backend/src/services/routines.service.ts`    | Reuse routine and habit-log ownership rules.                                                       |
| Goals, achievements, journal, notifications | Dedicated frontend slices and backend models/services                  | Challenge badges and AI insights should integrate with these, not duplicate them.                  |
| Stats and calendar                          | `src/features/stats`, `src/features/calendar`, backend services/routes | Add insight data to the existing Stats contract.                                                   |
| Authentication/session                      | JWT access token + httpOnly refresh cookie; Google sign-in             | Reuse for calendar OAuth and billing portal identity; do not store provider tokens in the browser. |
| Email/export                                | Backend email and report-generation paths exist                        | MVP3 should harden operational scheduling/providers rather than recreate UI.                       |
| Routing/layout                              | Protected app routes in `src/app/router.tsx` and sidebar layout        | Add MVP3 routes behind the same `ProtectedRoute` and update navigation/title maps.                 |

## MVP3 gap matrix

### 1. Friends, privacy, and leaderboards — **Not implemented (highest priority)**

Missing friendship requests, acceptance/removal, lookup by email/username, invite links, friend profiles, leaderboard metrics, and per-habit visibility (`private`, `friends`, `public`). There are no models, migrations, routes, services, frontend slices, or routes for these capabilities.

**Required foundation:** friendship state transitions, authorization queries, privacy filtering, abuse/rate limits, pagination, and a stable leaderboard aggregation query.

### 2. Group challenges — **Not implemented**

The prototype shows browse, create, detail, shared progress, and feed interactions, but the application has no Challenge or ChallengeCheckIn model/API/UI. Reactions, comments, invite links/email, visibility, date validation, participant limits, and completion-badge events all need implementation.

**Dependencies:** Friends/privacy; achievements integration; notification delivery; polling or websocket refresh for shared progress.

### 3. Routine bundling / sequenced routines — **Not implemented**

No bundle model, ordered habit relationship, guided sequence state, bundle check-in endpoint, or bundle streak calculation exists. The existing `Routine` entity represents an individual habit and should remain backward compatible.

### 4. Focus timer — **Not implemented**

No timer/session UI, persistence, pause/resume semantics, duration validation, accumulated time reporting, or desktop quick-action exists. Add a server-authoritative `FocusSession` model and make retries/idempotency safe.

### 5. Calendar provider sync — **Only an internal calendar view exists**

`/calendar` aggregates RoutineMate logs; it is not Google/Apple Calendar synchronization. Missing OAuth connection/disconnection, encrypted token storage, refresh/revocation, event create/update/delete, conflict detection, sync jobs, provider error recovery, and consent UX.

### 6. AI-generated insights — **Not implemented**

Stats currently provides deterministic aggregates, but there is no weekly `Insight` model, generation job, LLM provider abstraction, prompt/version storage, cost/rate controls, or insight card/action tracking. Build a deterministic fallback and never block Stats if generation fails.

### 7. Community, public roadmap, and feedback — **Not implemented**

No public `/roadmap`, authenticated `/feedback`, suggestion moderation/status workflow, voting, duplicate prevention, or community link configuration exists. The prototype’s Feedback & Roadmap screen is presentation-only.

### 8. Subscription and billing — **Not implemented**

Pricing copy exists, but there is no Subscription model, Stripe customer/checkout/portal integration, webhook signature verification, entitlement middleware, invoice history, or upgrade/downgrade/cancel flow. Keep tracking, streaks, and basic stats free as promised; gate only explicitly selected growth features.

### 9. Localization — **Not implemented**

Strings are embedded in React components and backend messages. Missing i18n catalog/loader, language preference persistence, translated validation/errors, locale-aware date/time and first-day-of-week formatting, and metric/imperial handling.

### 10. MVP2 operational hardening — **Baseline complete; verify in deployment**

Weekly email/export are considered complete for the MVP2 baseline. Before MVP3 release, verify provider credentials, scheduler deployment, retries, observability, privacy/retention, and large-report performance. Do not count this as new MVP3 scope unless deployment verification exposes a regression.

## Prototype-to-product interpretation

The prototype demonstrates the intended information architecture: Challenges and Friends in the sidebar; Stats & Insights with a Pro-labelled AI card; Feedback/Roadmap; Billing; and modal flows for bundles, timer, upgrade, and challenge creation. These screens should be treated as acceptance-criteria references for states and terminology, not as implemented functionality. Every visible action needs a real loading, empty, validation, error, authorization, and success state in the application.

## Recommended implementation order

1. **Platform foundations:** migrations, API conventions, authorization/policy helpers, audit logging, feature flags, pagination, and i18n string extraction for new screens.
2. **Friends + privacy:** friendship lifecycle, visibility rules, invite links, public/friend profile projection, and tests.
3. **Challenges:** create/join/leave, check-ins, shared feed, reactions/comments, notifications, and achievement badge hooks.
4. **Leaderboards:** selectable metric, time window, privacy-safe aggregation, ranking ties, and caching.
5. **Routine bundles:** ordered habits, guided/individual completion, bundle streaks, dashboard integration.
6. **Billing and entitlements:** Stripe Checkout/Portal, verified webhooks, subscription state, and server-side Pro middleware before gating features.
7. **Focus timer + calendar sync:** sessions first, then provider OAuth, encrypted token lifecycle, event sync and conflicts.
8. **AI insights:** weekly batch job, provider abstraction, deterministic fallback, moderation/safety, cost budget, and engagement telemetry.
9. **Feedback + public roadmap:** public read model, authenticated submissions/votes, moderation workflow, and community links.
10. **Localization completion:** translate supported locales, date/time/unit formatting, language settings route, and visual QA.

## Suggested route and data-model checklist

Routes: `/challenges`, `/challenges/:id`, `/friends`, `/routines/bundles/new`, `/roadmap`, `/feedback`, `/settings/language`, plus the existing pricing flow extended with billing management.

Models/migrations: `Challenge`, `ChallengeCheckIn`, `ChallengeReaction`/`ChallengeComment`, `Friendship`, `RoutineBundle`, `FocusSession`, `CalendarConnection`, `Insight`, `Subscription`, `FeedbackItem`, habit visibility fields, and invite tokens. Add indexes for user/date, challenge/date, friendship pair, leaderboard queries, and webhook event idempotency.

## Definition of MVP3 complete

- Each scope module has a real API, persistence, protected UI route, empty/loading/error states, and automated tests.
- Social data is privacy-filtered server-side; users cannot infer private habits through counts, rankings, or feeds.
- Billing entitlements are enforced server-side and webhook processing is idempotent.
- Calendar tokens are encrypted/managed with refresh and revoke behavior; sync failures are visible and recoverable.
- AI generation is batched, budgeted, observable, and has a non-AI fallback.
- Prototype flows work with real data on desktop and mobile, including accessibility and responsive states.
- Metrics from the scope (invites, challenge completion, Pro conversion/churn, timer/calendar use, insight engagement, feedback activity) are instrumented with privacy-conscious event names.

## First execution sprint

Create the MVP3 foundation and Friends vertical slice: add migrations/models and policy tests, implement friendship APIs and frontend route, add habit visibility controls to routine/profile settings, update sidebar/navigation, and add contract/integration tests. Do not build Challenges or Leaderboards until those privacy tests pass.
