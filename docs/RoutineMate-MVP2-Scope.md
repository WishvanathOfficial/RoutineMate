# RoutineMate — MVP-02 Scope & Documentation

This document defines the second build phase for RoutineMate ("Engagement Phase"), building directly on top of the MVP-1 clickable prototype. It covers what's already shipped, what's new in MVP-02, how it fits into the data model and site map, and what stays out of scope for now.

## 1. Recap — What MVP-1 Already Covers

MVP-1 (delivered as `RoutineMate-MVP1-Prototype.html`) includes: landing page with social proof, register/login, dashboard with today's habits and a live progress ring, routine create/edit/delete/pause with a habit-template picker, daily check-ins with streaks, a Stats page (weekly bar chart, category doughnut, 30-day trend, time-of-day activity, streak comparison — all Chart.js), a redesigned Calendar view, profile/settings basics, a collapsible sidebar with hover tooltips, and a time-based/location-based reminder toggle in the routine form.

MVP-02 does not repeat any of the above — it adds the next layer of engagement features on top of it.

## 2. MVP-02 Goal

Where MVP-1 proves the core loop (create → track → see progress), MVP-02's goal is **retention**: give users reasons to keep coming back beyond the daily checklist — celebration of progress, longer-term motivation, reflection, a smoother first-time experience, and the ability to use the app reliably even offline or as an installed app.

## 3. New Modules in MVP-02

### 3.1 Achievements & Gamification

- Badge system tied to milestones: streak badges (7 / 30 / 100 / 365 days), total check-ins (50 / 100 / 500), consistency badges (e.g. "4 weeks at 90%+").
- Points/XP awarded per check-in, with simple levels (e.g. Level 1–10) shown on the profile.
- Unlock animation/toast when a badge is earned ("🏆 New badge: 30-Day Streak!").
- New **Achievements** page (grid of badges, locked vs. unlocked state, progress toward the next one).
- Achievements surfaced contextually: a "Recent achievement" card on the Dashboard, and progress-to-next-badge shown on the Routine Detail page.

### 3.2 Goals Module

- Create long-term goals (e.g. "Run a 5K by October") and link one or more existing habits to it.
- Goal progress bar computed from linked habit completions, or manual milestone checkpoints for goals that aren't purely check-in based.
- Target date with a countdown indicator.
- New **Goals** page (list of active/completed goals) plus a "Goals" widget on the Dashboard.

### 3.3 Journal & Mood Tracking

- Daily short text reflection, optional and separate from habit check-ins.
- Mood selector (5-point emoji scale) logged alongside the journal entry.
- Mood-vs-completion correlation shown as a simple chart on the Stats page (e.g. "You complete 20% more habits on days you log a positive mood").
- New **Journal** page with a calendar-style entry list and a quick-add box on the Dashboard.

### 3.4 Onboarding Wizard

- Triggered once, immediately after registration, before the user lands on an empty dashboard.
- Step 1: pick 1–3 goal categories (Health, Mindfulness, Learning, Productivity, Wellness).
- Step 2: suggested starter habits based on category picks (reuses the MVP-1 template picker).
- Step 3: set a preferred daily reminder time.
- Ends by landing on the Dashboard pre-populated with 1–2 sample habits instead of an empty state.

### 3.5 Notification Center & Reminder Upgrades

- In-app bell icon (already present in MVP-1 topbar) becomes functional: dropdown with notification history (reminders fired, achievements unlocked, streak-at-risk warnings).
- Reminder snooze ("remind me in 30 min") and a daily digest notification ("3 habits left today — 6:00 PM").
- Smart nudge: if a habit is consistently completed late, suggest shifting its reminder time.

### 3.6 PWA / Offline Support

- App becomes installable (manifest + service worker) so it can be added to a phone's home screen.
- Offline check-ins: taps recorded locally are queued and synced once the connection returns.
- Basic caching of the shell so the app opens instantly even on a flaky connection.

### 3.7 Analytics Carry-Overs from MVP-1 Roadmap

- Export report as CSV/PDF from the Stats page.
- Optional weekly summary email ("Your week in review") — requires backend cron + email service.

## 4. New Routes / Site Map Additions

| Route            | Access                     | Purpose                  |
| ---------------- | -------------------------- | ------------------------ |
| `/onboarding`    | Private (first login only) | 3-step onboarding wizard |
| `/goals`         | Private                    | Goals list               |
| `/goals/new`     | Private                    | Create goal, link habits |
| `/achievements`  | Private                    | Badge grid               |
| `/journal`       | Private                    | Daily journal + mood log |
| `/journal/:date` | Private                    | Single day entry         |

Sidebar gains two new items: **Goals** and **Journal** (placed after Stats), plus an **Achievements** entry point (either its own sidebar link or accessible from the Profile page — recommend its own link given how central gamification is to retention).

## 5. Data Model Additions

- **Achievement**: `id, userId, type, threshold, unlockedAt` (already scoped in MVP-1 doc — now actually built).
- **UserXP**: `userId, totalPoints, level`.
- **Goal**: `id, userId, title, targetDate, linkedHabitIds[], milestones[], progress, status`.
- **JournalEntry**: `id, userId, date, mood (1–5), note`.
- **Notification**: `id, userId, type (reminder/achievement/digest), message, read, createdAt`.
- **OnboardingState**: `userId, completed (bool), stepReached`.

## 6. Non-Functional Additions

- **Offline-first data layer**: local queue (IndexedDB) for check-ins made offline, reconciled with the server on reconnect.
- **Push infrastructure**: Web Push API subscription storage per user/device.
- **Email service integration**: for weekly summaries and digest notifications (e.g. SendGrid/Postmark).
- **Analytics event tracking**: instrument achievement unlocks, goal creation, and onboarding completion rate to measure whether MVP-02 actually improves retention.

## 7. Explicitly Out of Scope for MVP-02

Deferred to MVP-03 / Growth phase: group Challenges, Routine Bundling (linked/sequenced habits), Focus Timer + calendar sync, AI-generated weekly insights, public roadmap/feedback channel, leaderboards, subscription/billing, localization.

## 8. Suggested Build Order

1. Onboarding wizard (affects first impression for every new user).
2. Goals module (reuses habit data already in place).
3. Achievements & Gamification (depends on having enough check-in history to feel meaningful).
4. Journal & Mood tracking.
5. Notification Center + reminder upgrades.
6. PWA/offline support (largest technical lift — schedule with enough buffer).
7. Analytics carry-overs (export, weekly email) — lowest urgency, can slip to MVP-03 if needed.

## 9. Success Metrics for MVP-02

- % of new users completing the onboarding wizard.
- 7-day and 30-day retention rate, compared to MVP-1 baseline.
- Average habits-per-user and check-ins-per-user-per-week.
- % of users who unlock at least one achievement in their first 2 weeks.
- % of installed PWA users vs. browser-only users.
