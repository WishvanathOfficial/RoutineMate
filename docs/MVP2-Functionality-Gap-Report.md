# RoutineMate MVP-02 — Functionality Cross-Check

Verified against `docs/RoutineMate-MVP2-Scope.md` and `docs/RoutineMate-MVP2-Prototype.html`, by reading the actual frontend (`src/`) and backend (`backend/src/`) code. Date: 2026-08-25.

## Summary

| Module                                              | Status                         |
| --------------------------------------------------- | ------------------------------ |
| Achievements & Gamification                         | Partial                        |
| Goals                                               | Partial                        |
| Journal & Mood                                      | Partial                        |
| Onboarding Wizard                                   | Mostly implemented             |
| Notification Center                                 | Mostly implemented             |
| PWA / Offline                                       | Partial                        |
| Analytics Carry-Overs (export, weekly email)        | Not functional — UI stubs only |
| New Routes                                          | Partial (4 of 6)               |
| Sidebar                                             | Partial (ordering deviates)    |
| Data Models                                         | Partial                        |
| Non-Functional Additions (push, analytics tracking) | Mostly missing                 |

## 1. Achievements & Gamification — Partial

- Streak badges: only 7/30/100 implemented. **365-day badge missing** from the catalog, the rule engine, and the Routine Detail thresholds.
- Check-in badges: only 50/100 implemented. **500-check-in badge missing.**
- Consistency badge ("4 weeks at 90%+"): exists in the catalog as "Perfect Week" but has no automatic unlock rule — unreachable in normal use, and doesn't match the spec's definition anyway.
- XP: awarded only on badge unlock (50 XP/badge), not per check-in as specced. Levels compute correctly.
- **Levels/XP not shown on Profile page** — only visible on the Achievements page, contradicting the spec.
- Unlock toast: implemented, matches spec copy ("🏆 New badge unlocked...").
- Achievements page (grid, locked/unlocked, progress): implemented.
- Dashboard "recent achievement" card: implemented.
- Routine Detail "progress to next badge": implemented.

## 2. Goals — Partial

- Create goal + link habits: implemented, but as a modal on `/goals` — **no dedicated `/goals/new` route** as the site map specifies.
- Progress bar from linked habits: implemented (derived server-side from streaks).
- **Manual milestone checkpoints: missing entirely** — no `milestones` field on the Goal model at all.
- Target date + countdown: implemented.
- Goals page (active/completed list): implemented.
- Dashboard Goals widget: implemented.

## 3. Journal & Mood Tracking — Partial

- Daily text reflection: implemented.
- 5-point mood emoji selector: implemented exactly as specced.
- **Mood-vs-completion correlation chart on Stats page: missing entirely** — not in the backend stats service, not on the Stats page, and not even present in the wireframe itself.
- Calendar-style entry list: implemented as a flat chronological list instead (matches the wireframe, but not the "calendar-style" wording in scope.md).
- Dashboard quick-add box: only a deep-link shortcut to `/journal`, not an inline save-from-dashboard box.
- **`/journal/:date` route: missing**, both frontend and backend (no per-date fetch endpoint).

## 4. Onboarding Wizard — Mostly implemented

- 3-step flow (categories → template-based starter habits → reminder time): implemented well, reuses the MVP-1 template picker as specified.
- Ends on a pre-populated dashboard: works, but only if the user keeps at least one suggested habit selected — a user can deselect all and still finish onto an empty dashboard.
- **"Once only" is not enforced.** Triggered by a one-time redirect after registration; there's no route guard checking `OnboardingState.completed` on login, so nothing stops a user revisiting `/onboarding` or skipping it if the redirect doesn't fire.

## 5. Notification Center & Reminder Upgrades — Mostly implemented

- Functional bell dropdown with history (reminders, achievements, streak-risk): implemented.
- 30-minute snooze: implemented end-to-end.
- Daily digest notification: implemented (copy differs slightly from the spec's example).
- **Smart nudge (suggest shifting reminder time for chronically-late completions): missing entirely** — no such logic anywhere in the codebase.

## 6. PWA / Offline Support — Partial

- Manifest + service worker (installable, shell caching): implemented.
- **Offline check-in queue (IndexedDB): missing** — explicitly flagged as deferred in the service worker's own code comment. No IndexedDB usage anywhere.
- Note: the "Install RoutineMate" button on Profile is a fake toast, not a real install prompt.

## 7. Analytics Carry-Overs — Not functional

- CSV/PDF export on Stats page: **UI stub only** — buttons show a "(demo)" toast, no real file generation or export endpoint.
- Weekly summary email: **UI stub only** — a toggle exists and persists to the DB, but there is no cron job and no email service integration (no SendGrid/Postmark/nodemailer dependency anywhere). The toggle currently does nothing.

## 8. New Routes — Partial (4 of 6)

Present and protected: `/onboarding`, `/goals`, `/achievements`, `/journal`.
**Missing:** `/goals/new`, `/journal/:date`.

## 9. Sidebar — Partial

Order is: Dashboard, Routines, **Goals**, Stats, Achievements, **Journal**, Calendar, Profile.
Spec wants Goals and Journal placed _after_ Stats — Journal matches, but **Goals is placed before Stats**, not after.

## 10. Data Models — Partial

| Model           | Gap                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Achievement     | Implemented differently (thresholds hardcoded in service, not data-driven) but functionally fine |
| UserXp          | Matches spec                                                                                     |
| Goal            | **Missing `milestones` field**                                                                   |
| JournalEntry    | Matches spec                                                                                     |
| Notification    | Matches spec (superset)                                                                          |
| OnboardingState | **Missing `stepReached` field** (not currently used for wizard resume anyway)                    |

## 11. Non-Functional Additions — Mostly missing

- Offline-first IndexedDB queue: missing (see §6).
- **Web Push subscription storage: missing entirely** — no model, migration, or push-related code.
- Email service integration: missing (see §7).
- **Analytics event tracking: missing entirely** — no event-tracking calls anywhere in frontend or backend.

## Out-of-scope check

No sign of Challenges, Routine Bundling, Focus Timer, AI insights, public roadmap, leaderboards, billing, or localization anywhere in the code — scope boundary is respected.

---

## Punch list (highest-impact gaps first)

1. Analytics carry-overs are entirely cosmetic — CSV/PDF export and weekly email do nothing.
2. Push infrastructure and analytics event tracking are completely absent (both called out as required non-functional additions).
3. Offline check-in queue (core PWA promise) is not built.
4. Onboarding's "once only" behavior isn't enforced server-side.
5. Smart nudge notification is missing.
6. Two routes missing: `/goals/new`, `/journal/:date`.
7. Two badge tiers missing (365-day streak, 500 check-ins) and the consistency badge is unreachable.
8. Profile page doesn't show XP/level as specced.
9. Goal milestones field missing from the data model.
10. Mood-vs-completion correlation chart missing from Stats page.
11. Minor: sidebar ordering (Goals before Stats instead of after).
