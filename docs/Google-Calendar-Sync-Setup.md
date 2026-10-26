# Google Calendar Sync Setup

This guide configures RoutineMate's one-way Google Calendar sync for local development or deployment.

## What sync does

- Exports active RoutineMate routines with a time-based reminder to the connected user's primary Google Calendar.
- Creates recurring events according to the routine's schedule. Events are 30 minutes long and use the time zone reported by the user's browser when they connect.
- Updates RoutineMate-managed events when a routine changes and removes those events when the routine is no longer eligible (for example, when it is archived or deleted).
- Skips routines without a valid time-based reminder.
- Does not import, inspect, or modify unrelated Google Calendar events.
- Runs when the user selects **Sync now**; this is not a background sync.

## 1. Configure Google Cloud

In the [Google Cloud Console](https://console.cloud.google.com/):

1. Select the Google Cloud project for the Calendar OAuth client.
2. Open **APIs & Services → Library**, find **Google Calendar API**, and enable it.
3. Configure the OAuth consent screen in **Google Auth Platform**. If the app's audience is External and its publishing status is Testing, add each account used for testing under **Audience → Test users**.
4. Create or select an OAuth client with application type **Web application**.
5. Add the backend callback URL under **Authorized redirect URIs**:

   ```text
   http://localhost:4000/api/calendar-sync/oauth/callback
   ```

For deployment, register the production callback as well, using the production API host, for example:

```text
https://api.example.com/api/calendar-sync/oauth/callback
```

The registered redirect URI must exactly match `GOOGLE_CALENDAR_REDIRECT_URI`, including scheme, host, port, and path. This is the backend callback, not the frontend URL. Copy the OAuth client ID and client secret from the same Web application client.

## 2. Configure backend environment

Set these values in `backend/.env` for local development, or in the backend hosting provider's secret/environment configuration for deployment:

```dotenv
GOOGLE_CALENDAR_CLIENT_ID=<Calendar OAuth web client ID>
GOOGLE_CALENDAR_CLIENT_SECRET=<matching Calendar OAuth web client secret>
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:4000/api/calendar-sync/oauth/callback
CALENDAR_TOKEN_ENCRYPTION_KEY=<private random key>
```

Keep `GOOGLE_CLIENT_ID` for Google sign-in. Calendar sync uses the separate `GOOGLE_CALENDAR_CLIENT_ID`; do not replace the sign-in client ID with the Calendar client ID.

Use a long, randomly generated value for `CALENDAR_TOKEN_ENCRYPTION_KEY` and keep it stable across restarts and deployments. Changing it makes previously stored Calendar tokens unreadable; affected users will need to disconnect and reconnect. Never commit secrets or place the Calendar client secret in a frontend environment variable.

Also configure:

- `CORS_ORIGIN` to the exact frontend origin, such as `http://localhost:5173`. After OAuth, the backend redirects to `/calendar` on this origin.
- The normal database and JWT environment variables required to start the backend.

The backend environment template is [`../backend/.env.example`](../backend/.env.example).

## 3. Run database migrations

From the repository root, make sure the backend database variables point to the intended database, then run:

```bash
npm --prefix backend run db:migrate
```

This applies all migrations not yet recorded as complete, including the Calendar connection time-zone and single-use OAuth state tables. Run it for each environment before enabling the feature. Do not manually drop tables if a migration fails; inspect the reported migration and database state first.

## 4. Enable the frontend feature

In the repository-root `.env` (copy from `.env.example` if needed), set:

```dotenv
VITE_FEATURE_CALENDAR_SYNC=true
```

Restart the Vite frontend after changing environment variables. Keep the flag disabled until the backend, Google client, and migrations are configured.

## 5. Verify the integration

1. Start the backend and frontend.
2. Sign in to RoutineMate and open **Calendar**.
3. Select **Connect Google Calendar** and approve access using an allowed Google account.
4. Select **Sync now**. The page reports how many routines were synced and skipped.
5. Check the primary Google Calendar for the recurring RoutineMate events.

The OAuth request uses the `calendar.events.owned` scope. Google OAuth state is signed, short-lived, and single-use. Access and refresh tokens are encrypted before storage. Sync refreshes an expired access token automatically. Disconnecting revokes the Google token and removes the saved connection.

## Troubleshooting

### Google shows `403: access_denied` or says the app is still being verified

If the OAuth app is in Testing mode, add the account you're using to **Google Auth Platform → Audience → Test users** in the same Cloud project as the Calendar OAuth client. Confirm `GOOGLE_CALENDAR_CLIENT_ID` belongs to that project.

### Google reports a redirect URI mismatch

Compare `GOOGLE_CALENDAR_REDIRECT_URI` with the OAuth client's **Authorized redirect URIs**. They must match exactly. Restart the backend after changing its `.env`.

### Connect reports OAuth is not configured

Check that `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, and `GOOGLE_CALENDAR_REDIRECT_URI` are present in the backend environment and restart the backend.

### Sync asks you to reconnect

Google rejected the stored refresh token, often because access was revoked from the Google account. Reconnect Google Calendar from RoutineMate. The saved connection status will indicate that authorization is required.

### Sync reports an event removal error

When a routine is deleted, the next sync removes its RoutineMate-managed Google event. Google responses `404` and `410` mean the event is already absent and are treated as successful cleanup. Other Google errors are reported so they can be investigated or retried.
