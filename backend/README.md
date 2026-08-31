# RoutineMate Backend (MVP-1)

Node.js + TypeScript REST API for the RoutineMate habit tracker. Express (route → controller → service), Sequelize v6 ORM, MySQL 8.

See `docs/RoutineMate-MVP1-Database-Design.html` (repo root `docs/`) for the full schema, ER diagram, and API-to-table mapping this implementation follows.

## Stack

- Express 4 + TypeScript 5
- Sequelize 6 (modern TS generics) + MySQL 8 (`utf8mb4`)
- JWT access + refresh tokens, httpOnly cookies, bcrypt password hashing
- Zod request validation
- UUID v4 primary keys, soft deletes (`paranoid: true`)

## Project layout

```
backend/
  config/config.js        # Sequelize CLI config (reads .env)
  src/
    config/               # env loader, database (Sequelize instance)
    models/                # Sequelize models + associations
    migrations/            # sequelize-cli migrations
    seeders/                # sequelize-cli seeders (demo data)
    validators/            # zod schemas
    utils/                 # ApiError, ApiResponse, jwt, password, asyncHandler
    middleware/            # auth, error, notFound, validate
    services/              # business logic
    controllers/           # thin HTTP handlers
    routes/                # express routers
    app.ts                 # express app (middleware + routes)
    server.ts              # http server bootstrap
  postman/                 # Postman collection + environment
```

## Setup

1. `cd backend && npm install`
2. `cp .env.example .env` and fill in real values (DB credentials, JWT secrets, and Resend email settings)
3. Create the database: `CREATE DATABASE routinemate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
4. Run migrations: `npm run db:migrate`
5. (Optional) Seed demo data matching the frontend mocks: `npm run db:seed`
6. Start dev server: `npm run dev` (default `http://localhost:4000`)

### Email delivery

Daily digest and weekly summary emails use Resend. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`; use `onboarding@resend.dev` for Resend testing or a sender address on a verified Resend domain for production. Users must enable the corresponding preference in Profile & Settings. Daily digests are sent after 20:00 server-local time, and weekly summaries are sent after 09:00 once every 7 days.

### Demo accounts

`npm run db:seed` creates **11 logins**, all with password `Demo@1234`:

- `demo@routinemate.app` — the original single demo account (5 routines, 14 days of history).
- 10 more accounts (`ava.martinez@routinemate.app`, `liam.chen@routinemate.app`, `sophia.patel@routinemate.app`, `noah.kim@routinemate.app`, `isabella.rossi@routinemate.app`, `ethan.johnson@routinemate.app`, `mia.nguyen@routinemate.app`, `lucas.silva@routinemate.app`, `amara.okafor@routinemate.app`, `daniel.novak@routinemate.app`) — each with 5 routines spanning all 5 categories and all 4 frequency types, 35 days of habit-log history, and varying preferences/completion rates (some near-perfect streaks, some inconsistent, one paused routine per third account), so every screen — Dashboard, Stats charts, Calendar heatmap, Routines list, Profile — has real, varied data to show immediately after login instead of an empty state.

All 11 accounts also get MVP-2 data derived from the above (see `20260824000008-mvp2-demo-data.js`): 1-2 goals linked to their own real routines, achievement badges/XP unlocked based on their actual streaks and check-in counts, 3 days of journal entries, a handful of notifications (including one per unlocked badge), and an onboarding state marked complete so demo logins land straight on the dashboard instead of the wizard.

## Scripts

| Script                                   | Purpose                       |
| ---------------------------------------- | ----------------------------- |
| `npm run dev`                            | ts-node + nodemon dev server  |
| `npm run build`                          | compile TypeScript to `dist/` |
| `npm start`                              | run compiled `dist/server.js` |
| `npm run typecheck`                      | `tsc --noEmit`                |
| `npm run db:migrate` / `db:migrate:undo` | run/rollback migrations       |
| `npm run db:seed` / `db:seed:undo`       | run/rollback seeders          |

## Auth model

- `POST /api/auth/register`, `/login` issue a short-lived JWT **access token** (returned in the response body) and a long-lived **refresh token** (set as an httpOnly cookie, and stored hashed in `refresh_tokens`).
- `POST /api/auth/refresh` reads the refresh cookie, validates it against the DB, and issues a new access token (rotates the refresh token).
- `POST /api/auth/logout` revokes the refresh token and clears the cookie.
- All other `/api/*` routes require `Authorization: Bearer <accessToken>`.

## Postman

Import `postman/RoutineMate.postman_collection.json` and `postman/RoutineMate.postman_environment.json`. The collection's `Login` request auto-captures `accessToken` into the environment via a test script, so every other request picks it up automatically.
