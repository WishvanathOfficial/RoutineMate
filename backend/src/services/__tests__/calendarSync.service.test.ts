jest.mock('../../models', () => ({
  CalendarOAuthState: { create: jest.fn(), destroy: jest.fn() },
  CalendarConnection: {
    create: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  Routine: { findAll: jest.fn() },
}));
jest.mock('../../utils/tokenEncryption', () => ({
  decryptToken: jest.fn(() => 'access-token'),
  encryptToken: jest.fn((value: string) => `encrypted:${value}`),
}));

import jwt from 'jsonwebtoken';
import { CalendarConnection, CalendarOAuthState, Routine } from '../../models';
import * as calendarSyncService from '../calendarSync.service';

describe('calendarSync.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CALENDAR_CLIENT_ID = 'google-calendar-client-id';
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_CALENDAR_REDIRECT_URI =
      'http://localhost:4000/api/calendar-sync/oauth/callback';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a Google authorization URL with signed user-bound state and least-privilege scope', async () => {
    const url = new URL(await calendarSyncService.googleConnectUrl('user-1', 'America/New_York'));
    const state = jwt.verify(url.searchParams.get('state')!, process.env.JWT_REFRESH_SECRET!);

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('google-calendar-client-id');
    expect(url.searchParams.get('scope')).toBe(
      'https://www.googleapis.com/auth/calendar.events.owned',
    );
    expect(state).toMatchObject({
      sub: 'user-1',
      purpose: 'google-calendar-oauth',
      timeZone: 'America/New_York',
    });
  });

  it('rejects invalid time zones before starting OAuth', async () => {
    await expect(calendarSyncService.googleConnectUrl('user-1', 'not-a-time-zone')).rejects.toThrow(
      'A valid IANA time zone is required.',
    );
  });

  it('consumes the OAuth state once before exchanging the authorization code', async () => {
    const url = new URL(await calendarSyncService.googleConnectUrl('user-1', 'UTC'));
    const state = url.searchParams.get('state')!;
    (CalendarOAuthState.destroy as jest.Mock).mockResolvedValue(0);
    const fetch = jest.spyOn(global, 'fetch');

    await expect(calendarSyncService.completeGoogleOAuth('auth-code', state)).rejects.toThrow(
      'already used',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('exchanges a verified callback code and stores encrypted tokens and the time zone', async () => {
    const url = new URL(await calendarSyncService.googleConnectUrl('user-1', 'Europe/Paris'));
    const state = url.searchParams.get('state')!;
    (CalendarOAuthState.destroy as jest.Mock).mockResolvedValue(1);
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'plain-access',
          refresh_token: 'plain-refresh',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );
    (CalendarConnection.findOne as jest.Mock).mockResolvedValue(null);

    await calendarSyncService.completeGoogleOAuth('auth-code', state);

    expect(CalendarConnection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        provider: 'google',
        encryptedAccessToken: 'encrypted:plain-access',
        encryptedRefreshToken: 'encrypted:plain-refresh',
        timeZone: 'Europe/Paris',
        status: 'connected',
      }),
    );
  });

  it('revokes Google authorization before deleting a disconnected connection', async () => {
    (CalendarConnection.findOne as jest.Mock).mockResolvedValue({
      encryptedRefreshToken: 'encrypted-refresh',
    });
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

    await calendarSyncService.disconnect('user-1', 'google');

    expect(fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(CalendarConnection.destroy).toHaveBeenCalledWith({
      where: { userId: 'user-1', provider: 'google' },
    });
  });

  it('upserts scheduled routine events, skips non-time reminders, and removes obsolete exports', async () => {
    const update = jest.fn();
    (CalendarConnection.findOne as jest.Mock).mockResolvedValue({
      encryptedAccessToken: 'encrypted-access',
      encryptedRefreshToken: 'encrypted-refresh',
      expiresAt: new Date(Date.now() + 3_600_000),
      timeZone: 'America/Los_Angeles',
      update,
    });
    (Routine.findAll as jest.Mock).mockResolvedValue([
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Read',
        emoji: '📚',
        reminderType: 'time',
        reminderTime: '19:00:00',
        frequencyType: 'weekdays',
        frequencyConfig: null,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Walk',
        emoji: '🚶',
        reminderType: 'location',
        reminderTime: null,
        frequencyType: 'daily',
        frequencyConfig: null,
        startDate: '2026-01-01',
        endDate: null,
      },
    ]);
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ id: 'old-event', extendedProperties: { private: { routineId: 'old' } } }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 410 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    const firstSync = await calendarSyncService.sync('user-1');
    const firstEvent = JSON.parse(String(fetch.mock.calls[1][1]?.body));
    const secondSync = await calendarSyncService.sync('user-1');

    expect(firstSync).toEqual({ synced: 1, skipped: 1 });
    expect(secondSync).toEqual({ synced: 1, skipped: 1 });
    expect(firstEvent.recurrence).toEqual([
      'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20270101T075959Z',
    ]);
    expect(firstEvent.start).toEqual({
      dateTime: '2026-01-01T19:00:00',
      timeZone: 'America/Los_Angeles',
    });
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(
      fetch.mock.calls.some(
        ([url, init]) => String(url).endsWith('/old-event') && init?.method === 'DELETE',
      ),
    ).toBe(true);
  });
});
