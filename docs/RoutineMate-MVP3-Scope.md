# RoutineMate — MVP-03 Scope & Documentation

This document defines the third build phase for RoutineMate ("Growth Phase"). It builds on MVP-1 (core loop) and MVP-02 (engagement/retention), and shifts focus to virality, differentiation, and monetization — the pieces needed to grow beyond a single-player habit tracker.

## 1. Recap — What MVP-1 and MVP-02 Already Cover

**MVP-1** (`RoutineMate-MVP1-Prototype.html`): landing page with social proof, register/login, dashboard with today's habits and progress ring, routine CRUD with a template picker, streaks, a Stats page with charts, a redesigned calendar, profile/settings basics, a collapsible sidebar, and time/location-based reminders.

**MVP-02** (`RoutineMate-MVP2-Prototype.html`): onboarding wizard, Goals module, Achievements & Gamification (levels/XP/badges), Journal & mood tracking, a functional Notification Center, PWA/offline UI, and Stats export buttons (CSV/PDF, UI-only) plus a weekly email summary toggle (UI-only).

MVP-03 does not repeat any of the above. It adds social/growth mechanics, the automation and integrations that make the product stickier and harder to copy, and the infrastructure to charge for it.

## 2. MVP-03 Goal

Where MVP-1 proved the core loop and MVP-02 built retention, MVP-03's goal is **growth and differentiation**: give users a reason to invite others (challenges, leaderboards), make the product feel smarter than a checklist (AI insights, routine bundling), integrate into tools people already use (calendar sync), and put a real monetization engine behind the "Pro" tier that's been teased on the pricing page since MVP-1.

## 3. New Modules in MVP-03

### 3.1 Group Challenges

- Create or join a time-boxed challenge tied to a habit (e.g. "30-Day Meditation Challenge") with friends or the public community.
- Shared progress view: see everyone's daily completion in the challenge, not just your own.
- Reactions/encouragement on a participant's check-in (emoji react, short comment).
- Challenge completion badge feeds into the MVP-02 Achievements system.
- New **Challenges** page: browse public challenges, view active/completed challenges, create a private challenge and invite by link or email.

### 3.2 Leaderboards & Friends

- Add friends (by email/username or invite link).
- Friend-only leaderboard ranked by current streak, weekly consistency %, or total check-ins (user-selectable metric).
- Per-friend profile view (their public habits/streaks only, respecting privacy settings).
- Privacy controls per habit: private / friends-visible / public (needed before any social data is shown).

### 3.3 Routine Bundling (Sequenced Routines)

- Group multiple existing habits into one ordered "Routine" (e.g. "Morning Routine" = Meditate → Drink Water → Read), inspired by the Routine.co "Custom Types" concept from the competitive analysis.
- Complete the bundle as a guided sequence from the dashboard (step through each habit in order) or check them off individually — user's choice.
- Bundle-level streak in addition to individual habit streaks.

### 3.4 Focus Timer & Calendar Sync

- Optional session timer for time-based habits (meditation, reading, exercise, deep work) with start/pause/complete controls and a running total logged per session.
- Two-way sync with Google Calendar / Apple Calendar: block time for a routine session alongside meetings, and detect conflicts.
- Menubar/notification-tray quick-timer for desktop (parity with what Routine.co offers).

### 3.5 AI-Generated Insights

- Weekly auto-generated summary in natural language (e.g. "You're most consistent on weekday mornings — your Monday completion rate is 40% higher than weekends").
- Smart suggestions: recommend a better reminder time based on actual completion patterns, flag habits at risk of being abandoned, suggest pairing a struggling habit with a strong one (habit stacking).
- Surfaced on the Stats page as an "Insights" card and optionally in the weekly email summary.

### 3.6 Community & Feedback Channel

- Public roadmap page showing what's planned/in progress/shipped (mirrors what Routine.co does with Discord/Reddit/roadmap to build trust).
- In-app feedback widget ("Suggest a feature" / upvote existing suggestions).
- Optional link-out to a community space (Discord/Reddit) for power users.

### 3.7 Subscription & Billing (Pro Tier)

- Turns the "Coming Soon" Pro tier (present on the pricing page since MVP-1) into a real paid plan.
- Pro-gated features to decide during planning: unlimited challenges/friends, advanced AI insights, calendar sync, custom themes, priority support. (Recommendation: keep core tracking, streaks, and basic stats free forever, per the MVP-1 pricing promise — gate only the growth-phase additions.)
- Stripe (or similar) integration: checkout, plan management, invoices, upgrade/downgrade/cancel flows in Profile & Settings.

### 3.8 Localization

- Multi-language UI (starting with 2–3 languages based on user base data).
- Locale-aware date/time formatting, first-day-of-week, and units (metric/imperial) — some of this groundwork already exists as MVP-1 settings fields.

### 3.9 Backend Completion of MVP-02 UI-Only Features

Two MVP-02 features shipped as UI-only demos and need real backend work in MVP-03:

- **Weekly email summary**: actual email service integration (e.g. SendGrid/Postmark) + cron job, instead of just a toggle.
- **CSV/PDF export**: real report generation and file download, instead of a toast message.

## 4. New Routes / Site Map Additions

| Route                   | Access  | Purpose                                                         |
| ----------------------- | ------- | --------------------------------------------------------------- |
| `/challenges`           | Private | Browse/join/create challenges                                   |
| `/challenges/:id`       | Private | Challenge detail, shared progress feed                          |
| `/friends`              | Private | Friends list, add friend, leaderboard                           |
| `/routines/bundles/new` | Private | Create a sequenced routine bundle                               |
| `/pricing` upgrade flow | Private | Checkout / plan management (extends existing public `/pricing`) |
| `/roadmap`              | Public  | Public roadmap / changelog                                      |
| `/feedback`             | Private | Feature suggestions + voting                                    |
| `/settings/language`    | Private | Localization preference                                         |

Sidebar gains **Challenges** and **Friends**; Profile & Settings gains a **Billing** section and a **Language** preference.

## 5. Data Model Additions

- **Challenge**: `id, title, habitTemplate, startDate, endDate, visibility (private/public), creatorId, participantIds[]`.
- **ChallengeCheckIn**: `id, challengeId, userId, date, completed`.
- **Friendship**: `userId, friendId, status (pending/accepted), createdAt`.
- **RoutineBundle**: `id, userId, title, orderedHabitIds[], streak`.
- **FocusSession**: `id, habitId, userId, startedAt, durationSeconds, completed`.
- **CalendarConnection**: `userId, provider (google/apple), accessToken, refreshToken`.
- **Insight**: `id, userId, weekOf, summaryText, suggestions[]`.
- **Subscription**: `userId, plan (free/pro), status, renewsAt, stripeCustomerId`.
- **FeedbackItem**: `id, userId, title, description, votes, status (planned/in-progress/shipped)`.

## 6. Non-Functional Additions

- **Real-time-ish updates**: challenge progress feeds benefit from polling or websockets so participants see fresh data without a manual refresh.
- **OAuth integrations**: Google/Apple Calendar connection flows, token refresh handling.
- **Payment compliance**: PCI-DSS scope minimized by using Stripe Checkout/Billing rather than handling card data directly.
- **AI/LLM cost management**: weekly insight generation should be batched (e.g. one generation per user per week) rather than real-time, to control inference cost.
- **i18n infrastructure**: string externalization across the whole app (this is disruptive to retrofit — worth starting early even if only 1 language ships first).

## 7. Explicitly Out of Scope for MVP-03

Beyond MVP-03 (future consideration, not yet scheduled): native iOS/Android apps (currently PWA-only, as stated on the MVP-1 landing page FAQ), wearable integrations (Apple Watch/Wear OS), team/enterprise accounts, and advanced AI coaching (beyond weekly pattern summaries).

## 8. Suggested Build Order

1. Friends + privacy controls (prerequisite for everything social — must exist before Challenges or Leaderboards can show any data).
2. Group Challenges (highest expected impact on growth/virality, per the Productive app benchmark).
3. Leaderboards (reuses Friends + Challenges data already in place).
4. Routine Bundling (self-contained, no dependency on social features).
5. Subscription & Billing (needed before gating any Pro feature below).
6. Focus Timer + Calendar Sync (Pro-gated candidate).
7. AI-Generated Insights (Pro-gated candidate; also benefits from having a full quarter of MVP-1/MVP-02 usage data to train/tune on).
8. Community & Feedback Channel (can run in parallel with any of the above — mostly independent).
9. Localization (schedule last unless a specific market launch forces it earlier).
10. Backend completion of weekly email + export (can be picked up opportunistically alongside any of the above).

## 9. Success Metrics for MVP-03

- Viral/referral coefficient: invites sent per user, % of invites that convert to signups (Challenges + Friends).
- Challenge participation rate and challenge completion rate vs. solo habits.
- Free-to-Pro conversion rate, and churn rate of Pro subscribers.
- % of users connecting a calendar or using the focus timer at least once.
- Insight engagement: % of users who open/act on their weekly AI insight.
- Feedback board activity (submissions + votes) as a proxy for engaged power users.
