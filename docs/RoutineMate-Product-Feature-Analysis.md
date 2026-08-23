# RoutineMate — Product & Feature Analysis

A React.js habit and routine tracking application. This document breaks down the full product into modules, pages, features, data models, and a build roadmap.

## 1. Product Summary

RoutineMate helps users build and maintain habits/routines through tracking, reminders, streaks, and progress insights. The product has two zones:

- **Public zone**: marketing/landing site + auth (no login required).
- **App zone**: dashboard and all habit-tracking features (login required).

Flow: `Landing Page → Sign Up / Login → Dashboard → Feature Modules`.

## 2. Site Map / Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/features` | Public | Feature deep-dive (optional, can be sections on `/`) |
| `/pricing` | Public | Plans (if monetized) |
| `/about` | Public | About/mission |
| `/login` | Public | Login |
| `/register` | Public | Sign up |
| `/forgot-password` | Public | Password reset request |
| `/reset-password/:token` | Public | Set new password |
| `/verify-email/:token` | Public | Email verification |
| `/dashboard` | Private | Main app home |
| `/routines` | Private | All routines/habits list |
| `/routines/:id` | Private | Single routine detail |
| `/routines/new` | Private | Create routine/habit |
| `/calendar` | Private | Calendar view of all routines |
| `/stats` | Private | Analytics & insights |
| `/goals` | Private | Long-term goals linked to habits |
| `/achievements` | Private | Badges, streaks, rewards |
| `/reminders` | Private | Notification settings per habit |
| `/journal` | Private | Daily notes/mood log |
| `/community` (optional) | Private | Social/sharing features |
| `/profile` | Private | User profile |
| `/settings` | Private | App settings, account, theme |
| `*` | Public | 404 page |

Routing implemented with React Router v6, wrapped in a `PrivateRoute`/`AuthGuard` component checking auth state (context or Redux/Zustand + token in httpOnly cookie or secure storage).

## 3. Landing Page (Public) — Sections

1. **Navbar** — Logo, Features, Pricing, About, Login, Sign Up (CTA button).
2. **Hero section** — Value proposition headline, subtext, primary CTA ("Start Free"), product screenshot/mockup or animated illustration.
3. **Problem/solution strip** — Why habits fail vs. how RoutineMate helps.
4. **Feature highlights** — 4–6 cards (Habit Tracking, Streaks, Smart Reminders, Analytics, Calendar View, Achievements).
5. **How it works** — 3-step visual (Create routine → Track daily → See progress).
6. **Social proof** — Testimonials, user count, star rating.
7. **Screenshots/demo** — App preview carousel or embedded demo GIF.
8. **Pricing** (if applicable) — Free vs Pro tier comparison.
9. **FAQ** — Common questions.
10. **Final CTA banner** — "Create your free account."
11. **Footer** — Links, social icons, contact, legal (Privacy, Terms).

Design notes: responsive, dark/light mode toggle, fast-loading (lazy-loaded images), SEO meta tags, smooth scroll anchors.

## 4. Authentication Module

### Features
- Register with email/password (name, email, password, confirm password).
- Social login (Google/Apple) — optional, phase 2.
- Login with email/password, "remember me."
- Forgot/reset password via email token.
- Email verification on signup.
- Form validation (client-side with react-hook-form + zod/yup) and server-side.
- JWT access token + refresh token pattern, stored in httpOnly cookies (preferred) or memory + refresh flow.
- Rate limiting/error states (wrong password, account locked, too many attempts).
- Redirect logic: unauthenticated → `/login`; authenticated hitting `/login` or `/` → `/dashboard`.
- Logout (clear tokens, invalidate refresh token server-side).

### Post-login redirect
On successful login/register, user is redirected to `/dashboard`. First-time users see a short onboarding flow (see Module 12).

## 5. Dashboard (App Home)

The dashboard is the command center after login.

- **Greeting header** — "Good morning, {name}" + current date + motivational quote.
- **Today's routines widget** — checklist of today's scheduled habits with quick-complete toggle.
- **Streak summary** — current streak count, longest streak, per-habit streak flames.
- **Progress ring/chart** — today's completion %, weekly completion trend (mini chart).
- **Upcoming reminders** — next 2–3 scheduled habits with time.
- **Quick add** — floating action button to add a new habit/routine instantly.
- **Recent achievements** — latest badge unlocked.
- **Mood/journal quick entry** (optional widget).
- **Empty state** for new users — prompt to create first routine.

## 6. Core Feature Modules

### 6.1 Routine/Habit Management
- Create habit: name, category (health, productivity, mindfulness, learning, custom), icon/emoji, description.
- Frequency options: daily, specific weekdays, X times per week, custom interval (every N days).
- Time of day / reminder time.
- Duration/target (e.g., 20 minutes, 8 glasses, 10,000 steps) — quantitative habits vs. simple check-off habits.
- Start date, optional end date (challenges, e.g., "30-day water challenge").
- Edit, pause, archive, delete routine.
- Habit templates/presets library (drink water, read, exercise, meditate, sleep early, no smoking, etc.).
- Grouping habits into a "Routine" (e.g., "Morning Routine" bundles 5 habits in sequence).

### 6.2 Tracking & Check-ins
- One-tap complete/incomplete toggle per day.
- Partial progress for quantitative habits (e.g., logged 5 of 8 glasses).
- Skip/reschedule for a day with reason (optional note).
- Backfill/edit past entries (with restrictions, e.g., only last 3 days).
- Undo action.

### 6.3 Streaks & Consistency
- Current streak & longest streak per habit and overall.
- Streak freeze/grace day (limited uses, prevents streak break for valid reasons).
- Visual streak calendar (heatmap, GitHub-contribution style).
- Weekly/monthly consistency percentage.

### 6.4 Calendar View
- Month/week/day toggle.
- Color-coded completion per habit.
- Click a date to see all habits scheduled that day and mark them.
- Drag-to-reschedule (optional advanced feature).

### 6.5 Analytics & Insights
- Overall completion rate (daily/weekly/monthly/yearly).
- Per-habit trend line chart.
- Best/worst performing habits.
- Time-of-day completion pattern (heatmap).
- Category breakdown (pie/donut chart: health vs productivity vs mindfulness).
- Exportable report (CSV/PDF) — phase 2.
- Weekly summary email (optional, requires backend cron + email service).

### 6.6 Goals
- Long-term goals linked to one or more habits (e.g., "Run a 5K" ← linked to daily running habit).
- Progress bar toward goal (based on linked habit completions or manual milestones).
- Target date, milestone checkpoints.

### 6.7 Achievements & Gamification
- Badges for streak milestones (7, 30, 100, 365 days), total completions, consistency.
- Points/XP system, levels.
- Daily motivational quotes/tips.
- Optional leaderboard among friends (ties to social module).

### 6.8 Reminders & Notifications
- Push notifications (web push API) or email reminders per habit.
- Custom reminder time per habit, snooze option.
- Daily digest notification ("You have 3 habits left today").
- Smart reminders (nudge if user usually completes late).
- In-app notification center (bell icon with history).

### 6.9 Journal / Mood Tracking (optional but valuable add-on)
- Daily short note/reflection.
- Mood selector (emoji scale) correlated with habit completion in analytics.

### 6.10 Social / Community (optional, phase 2+)
- Add friends, share specific habit progress.
- Group challenges (e.g., "30-Day Meditation Challenge" with friends).
- Leaderboards, encouragement/reactions on friend's streaks.
- Privacy controls per habit (private/friends/public).

### 6.11 Profile & Settings
- Profile: avatar, name, bio, join date, stats summary.
- Account settings: change email/password, delete account, data export/download (GDPR-style).
- App preferences: theme (light/dark/system), first day of week, date format, units (metric/imperial).
- Notification preferences (global on/off, channel choice).
- Subscription/billing management (if freemium model).
- Language/localization (phase 2).

### 6.12 Onboarding (first-time user experience)
- Post-registration short wizard: pick goal categories → suggest starter habit templates → set first reminder → land on dashboard with 1–2 sample habits pre-filled.

## 7. Non-Functional Requirements

- **Responsive design**: mobile-first, works on tablet/desktop (habit tracking is heavily mobile-used).
- **PWA support**: installable, offline-capable check-ins that sync when back online.
- **Performance**: code-splitting per route, lazy loading, memoized chart components.
- **Accessibility**: WCAG AA — keyboard navigation, ARIA labels, color-contrast-safe streak indicators.
- **Security**: HTTPS only, password hashing (bcrypt/argon2) server-side, CSRF protection, input sanitization, secure cookie flags.
- **Testing**: unit tests (Jest/Vitest + React Testing Library), e2e (Playwright/Cypress) for auth + core tracking flows.
- **Analytics/telemetry**: basic product analytics (PostHog/Mixpanel) to see feature adoption.

## 8. Suggested Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | React.js (Vite), TypeScript |
| Routing | React Router v6 |
| State management | Redux Toolkit or Zustand + React Query/TanStack Query for server state |
| Styling | Tailwind CSS + shadcn/ui or MUI |
| Forms/validation | react-hook-form + zod |
| Charts | Recharts or Chart.js |
| Calendar | react-big-calendar or a custom heatmap component |
| Auth | JWT (access + refresh), httpOnly cookies |
| Backend (recommended) | Node.js + Express/NestJS, or Firebase/Supabase for faster MVP |
| Database | PostgreSQL (habits, users, logs) — relational fits recurring schedules well |
| Notifications | Web Push API / OneSignal, cron jobs for daily digests |
| Hosting | Vercel/Netlify (frontend), Railway/Render/Supabase (backend+DB) |

## 9. Core Data Model (simplified)

- **User**: id, name, email, passwordHash, avatarUrl, createdAt, preferences.
- **Habit**: id, userId, title, category, icon, frequencyType, frequencyConfig, targetValue, unit, reminderTime, startDate, endDate, status(active/paused/archived), createdAt.
- **HabitLog**: id, habitId, date, status(done/skipped/partial), value, note, completedAt.
- **Goal**: id, userId, title, targetDate, linkedHabitIds[], progress.
- **Achievement**: id, userId, type, unlockedAt.
- **Reminder**: id, habitId, time, channel, enabled.
- **JournalEntry**: id, userId, date, mood, note.

## 10. Build Roadmap (Phased)

**Phase 1 — MVP**
Landing page (with social proof), register/login, dashboard (today's habits widget), create/edit/delete habit (with template picker), daily check-in, basic streaks, calendar view, basic stats/insights, routines list/grid view toggle, profile/settings basics.

**Phase 2 — Engagement**
Full analytics/stats page, achievements/badges, reminders/notifications (incl. location-based), goals module, journal/mood tracking, onboarding wizard, PWA/offline support.

**Phase 3 — Growth**
Group challenges, routine bundling (linked/sequenced habits), focus timer + calendar sync, AI-generated insights, community/feedback channel, leaderboards, data export, subscription/billing, localization, weekly email summaries.

## 11. Competitive Analysis & MVP-1 Enhancements

Reviewed two direct references to benchmark RoutineMate against the market:

- **[Routine.co](https://routine.co/solutions/individuals/habit-tracking)** — a productivity suite combining calendar, tasks, and habit tracking. Strengths: custom relationships between habits ("Custom Types"), multiple visualization layouts (table/list/chart) for the same data, time-blocking habit sessions on a calendar with a timer, and a public roadmap/changelog plus active community (Discord/Slack/Reddit) for trust and feedback.
- **[Productive](https://productiveapp.io/)** (15M+ downloads) — mobile-first habit tracker. Strengths: a large library of ready-made habit templates to reduce setup friction, visual stats with milestone celebrations, group "Challenges" where users track a habit together and share progress, location-based (not just time-based) reminders, and heavy social proof (ratings, download counts, testimonials) directly under the hero.

Based on this, the following five items were folded into MVP-1:

1. **Social Proof section** on the landing page — rating/user-count stat bar plus testimonial cards, placed after the hero.
2. **Habit Template Picker** — quick-start chips (Drink Water, Meditate, Read, Exercise, Sleep, Quit Smoking, Journal, Eat Healthy) inside the Create/Edit Routine modal that pre-fill sensible defaults, reducing blank-form friction.
3. **Stats & Insights module** — new sidebar page with a weekly completion bar chart, per-habit consistency bars, and a category breakdown chart (Chart.js), addressing the "visualize progress in multiple ways" gap.
4. **Routines Grid/List view toggle** — switch between the card grid and a compact list layout on the Routines page.
5. **Location-based reminder option** — a Time-based / Location-based segmented toggle in the reminder section of the Create/Edit Routine modal.

Additionally, the **Calendar view was redesigned** for legibility: larger day cells with colored borders/backgrounds and status icons (done/partial/missed) replace the previous small dot indicators, with a clearer legend and a stronger highlight on today.

Deferred to later phases (higher effort, not core to MVP-1): group Challenges (pulled forward from Phase 3 given its proven engagement impact for Productive), Routine Bundling (linked/sequenced habits, inspired by Routine.co's Custom Types), Focus Timer + calendar sync, AI-generated weekly insights, and a public roadmap/feedback channel.

## 12. Next Steps

1. Confirm scope for Phase 1 (MVP) vs. full feature set above.
2. Choose backend approach (custom Node API vs. Supabase/Firebase for speed).
3. Scaffold React app (Vite + TypeScript + Tailwind + React Router).
4. Build landing page, then auth, then dashboard shell, then habit CRUD + check-ins.
