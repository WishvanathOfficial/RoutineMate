import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Op } from 'sequelize';
import { CalendarConnection, CalendarOAuthState, Routine } from '../models';
import type { Routine as RoutineModel } from '../models/routine.model';
import { env } from '../config/env';
import { decryptToken, encryptToken } from '../utils/tokenEncryption';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';
const STATE_TTL = '10m';

interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleEvent {
  id: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence: string[];
  extendedProperties: {
    private: { routinemate: string; routineId: string };
  };
}

interface GoogleEventList {
  items?: Array<{ id?: string; extendedProperties?: { private?: { routineId?: string } } }>;
  nextPageToken?: string;
}

function validateTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
  } catch {
    throw ApiError.badRequest('A valid IANA time zone is required.');
  }
  return timeZone;
}

function requireGoogleConfiguration(): void {
  if (
    !env.google.calendarClientId ||
    !env.google.calendarClientSecret ||
    !env.google.calendarRedirectUri
  ) {
    throw new ApiError(503, 'Google Calendar OAuth is not configured.');
  }
}

function expiryDate(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function exchangeAuthorizationCode(code: string): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    client_id: env.google.calendarClientId,
    client_secret: env.google.calendarClientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: env.google.calendarRedirectUri,
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const result = await responseJson(response);
  if (
    !response.ok ||
    !isRecord(result) ||
    typeof result.access_token !== 'string' ||
    typeof result.expires_in !== 'number'
  ) {
    throw ApiError.badRequest('Google authorization could not be completed.');
  }
  return {
    access_token: result.access_token,
    refresh_token: typeof result.refresh_token === 'string' ? result.refresh_token : undefined,
    expires_in: result.expires_in,
  };
}

export async function connections(userId: string) {
  return CalendarConnection.findAll({
    where: { userId },
    attributes: ['id', 'provider', 'status', 'expiresAt'],
  });
}

export async function googleConnectUrl(userId: string, requestedTimeZone: string): Promise<string> {
  requireGoogleConfiguration();
  const timeZone = validateTimeZone(requestedTimeZone);
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await CalendarOAuthState.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
  await CalendarOAuthState.create({ userId, nonce, expiresAt });
  const state = jwt.sign(
    { sub: userId, purpose: 'google-calendar-oauth', timeZone, nonce },
    env.jwt.refreshSecret,
    { expiresIn: STATE_TTL },
  );
  const params = new URLSearchParams({
    client_id: env.google.calendarClientId,
    redirect_uri: env.google.calendarRedirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function completeGoogleOAuth(code: string, state: string): Promise<void> {
  requireGoogleConfiguration();
  let payload: JwtPayload;
  try {
    const verified = jwt.verify(state, env.jwt.refreshSecret);
    if (typeof verified === 'string') throw new Error('Invalid OAuth state');
    payload = verified;
  } catch {
    throw ApiError.badRequest('Google authorization state is invalid or expired.');
  }
  if (
    payload.purpose !== 'google-calendar-oauth' ||
    typeof payload.sub !== 'string' ||
    typeof payload.timeZone !== 'string' ||
    typeof payload.nonce !== 'string'
  ) {
    throw ApiError.badRequest('Google authorization state is invalid or expired.');
  }
  const consumed = await CalendarOAuthState.destroy({
    where: {
      userId: payload.sub,
      nonce: payload.nonce,
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  if (consumed !== 1) {
    throw ApiError.badRequest('Google authorization state is invalid, expired, or already used.');
  }

  const tokens = await exchangeAuthorizationCode(code);
  const existing = await CalendarConnection.findOne({
    where: { userId: payload.sub, provider: 'google' },
  });
  const refreshToken = tokens.refresh_token
    ? encryptToken(tokens.refresh_token)
    : existing?.encryptedRefreshToken;
  if (!refreshToken) {
    throw ApiError.badRequest(
      'Google did not provide a refresh token. Reconnect and grant access.',
    );
  }

  const values = {
    encryptedAccessToken: encryptToken(tokens.access_token),
    encryptedRefreshToken: refreshToken,
    expiresAt: expiryDate(tokens.expires_in),
    timeZone: validateTimeZone(payload.timeZone),
    status: 'connected',
  };
  if (existing) {
    await existing.update(values);
  } else {
    await CalendarConnection.create({
      userId: payload.sub,
      provider: 'google',
      ...values,
    });
  }
}

export async function disconnect(userId: string, provider: 'google' | 'apple'): Promise<void> {
  if (provider !== 'google' && provider !== 'apple') {
    throw ApiError.badRequest('Unsupported calendar provider.');
  }
  if (provider === 'google') {
    const connection = await CalendarConnection.findOne({ where: { userId, provider } });
    if (connection) {
      const body = new URLSearchParams({
        token: decryptToken(connection.encryptedRefreshToken),
      });
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok && response.status !== 400) {
        throw new ApiError(
          502,
          `Google Calendar authorization revocation failed (${response.status}).`,
        );
      }
      if (response.status === 400) {
        logger.warn('Google Calendar token was already invalid during disconnect.');
      }
    }
  }
  await CalendarConnection.destroy({ where: { userId, provider } });
}

async function googleApiRequest(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(`${GOOGLE_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  return { response, data: await responseJson(response) };
}

async function getValidAccessToken(connection: CalendarConnection): Promise<string> {
  if (connection.expiresAt && connection.expiresAt.getTime() > Date.now() + 60_000) {
    return decryptToken(connection.encryptedAccessToken);
  }

  const body = new URLSearchParams({
    client_id: env.google.calendarClientId,
    client_secret: env.google.calendarClientSecret,
    grant_type: 'refresh_token',
    refresh_token: decryptToken(connection.encryptedRefreshToken),
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const result = await responseJson(response);
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      await connection.update({ status: 'reauth_required' });
      logger.warn('Google Calendar token refresh failed; user authorization is required.');
      throw new ApiError(401, 'Reconnect Google Calendar to continue syncing.');
    }
    throw new ApiError(502, `Google Calendar token refresh failed (${response.status}).`);
  }
  if (
    !isRecord(result) ||
    typeof result.access_token !== 'string' ||
    typeof result.expires_in !== 'number'
  ) {
    throw new ApiError(502, 'Google Calendar returned an invalid token response.');
  }
  await connection.update({
    encryptedAccessToken: encryptToken(result.access_token),
    expiresAt: expiryDate(result.expires_in),
    status: 'connected',
  });
  return result.access_token;
}

function dateFromUtc(date: string): Date {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()))
    throw ApiError.badRequest('Routine has an invalid start date.');
  return parsed;
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function expectedOnDate(routine: RoutineModel, date: string): boolean {
  const day = dateFromUtc(date).getUTCDay();
  switch (routine.frequencyType) {
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'specific_days':
      return (routine.frequencyConfig?.days ?? []).includes(day);
    case 'interval': {
      const interval = routine.frequencyConfig?.everyNDays ?? 1;
      const elapsed =
        (dateFromUtc(date).getTime() - dateFromUtc(routine.startDate).getTime()) / 86_400_000;
      return interval > 0 && elapsed >= 0 && elapsed % interval === 0;
    }
    case 'daily':
      return true;
  }
}

function firstOccurrence(routine: RoutineModel): string | null {
  const start = dateFromUtc(routine.startDate);
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(start);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    const date = dateString(candidate);
    if (routine.endDate && date > routine.endDate) return null;
    if (expectedOnDate(routine, date)) return date;
  }
  return null;
}

const BY_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guess)).map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const difference = target - represented;
    guess += difference;
    if (difference === 0) break;
  }
  return new Date(guess);
}

function recurrenceRule(routine: RoutineModel, timeZone: string): string | null {
  let rule: string;
  switch (routine.frequencyType) {
    case 'daily':
      rule = 'FREQ=DAILY';
      break;
    case 'weekdays':
      rule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
      break;
    case 'specific_days': {
      const days = [...new Set(routine.frequencyConfig?.days ?? [])]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b);
      if (days.length === 0) return null;
      rule = `FREQ=WEEKLY;BYDAY=${days.map((day) => BY_DAY[day]).join(',')}`;
      break;
    }
    case 'interval': {
      const interval = routine.frequencyConfig?.everyNDays ?? 1;
      if (!Number.isInteger(interval) || interval < 1) return null;
      rule = `FREQ=DAILY;INTERVAL=${interval}`;
      break;
    }
  }
  if (routine.endDate) {
    const until = zonedDateTimeToUtc(routine.endDate, '23:59:59', timeZone)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
    rule += `;UNTIL=${until}`;
  }
  return `RRULE:${rule}`;
}

function eventEnd(date: string, time: string, duration: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const end = dateFromUtc(date);
  end.setUTCMinutes(hours * 60 + mins + duration);
  const nextDate = dateString(end);
  const totalMinutes = hours * 60 + mins + duration;
  const endHours = Math.floor((totalMinutes % 1440) / 60);
  const endMinutes = totalMinutes % 60;
  const seconds = time.split(':')[2] ?? '00';
  return `${nextDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:${seconds}`;
}

function eventId(routineId: string): string {
  return `routinemate${routineId.replace(/-/g, '').toLowerCase()}`;
}

function toGoogleEvent(routine: RoutineModel, timeZone: string): GoogleEvent | null {
  if (routine.reminderType !== 'time' || !routine.reminderTime) return null;
  const firstDate = firstOccurrence(routine);
  const recurrence = recurrenceRule(routine, timeZone);
  if (!firstDate || !recurrence) return null;
  const time = routine.reminderTime.slice(0, 8);
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null;
  const parts = time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  const start = `${firstDate}T${time.length === 5 ? `${time}:00` : time}`;
  return {
    id: eventId(routine.id),
    summary: `${routine.emoji} ${routine.name}`,
    description: 'RoutineMate routine reminder.',
    start: { dateTime: start, timeZone },
    end: { dateTime: eventEnd(firstDate, time, 30), timeZone },
    recurrence: [recurrence],
    extendedProperties: { private: { routinemate: 'true', routineId: routine.id } },
  };
}

async function upsertRoutineEvent(
  routine: RoutineModel,
  timeZone: string,
  accessToken: string,
): Promise<boolean> {
  const event = toGoogleEvent(routine, timeZone);
  if (!event) return false;
  const encodedId = encodeURIComponent(event.id);
  const patch = await googleApiRequest(`/calendars/primary/events/${encodedId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(event),
  });
  if (patch.response.ok) return true;
  if (patch.response.status !== 404) {
    throw new ApiError(502, `Google Calendar event update failed (${patch.response.status}).`);
  }

  const created = await googleApiRequest('/calendars/primary/events', accessToken, {
    method: 'POST',
    body: JSON.stringify(event),
  });
  if (created.response.ok) return true;
  if (created.response.status === 409) {
    const retried = await googleApiRequest(`/calendars/primary/events/${encodedId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(event),
    });
    if (retried.response.ok) return true;
  }
  throw new ApiError(502, `Google Calendar event creation failed (${created.response.status}).`);
}

async function listRoutineEvents(
  accessToken: string,
): Promise<NonNullable<GoogleEventList['items']>> {
  const events: NonNullable<GoogleEventList['items']> = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      maxResults: '2500',
      privateExtendedProperty: 'routinemate=true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const result = await googleApiRequest(
      `/calendars/primary/events?${params.toString()}`,
      accessToken,
    );
    if (!result.response.ok || !isRecord(result.data)) {
      throw new ApiError(502, `Google Calendar event listing failed (${result.response.status}).`);
    }
    const page = result.data as GoogleEventList;
    events.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return events;
}

async function deleteStaleRoutineEvents(
  accessToken: string,
  routineIds: Set<string>,
): Promise<void> {
  for (const event of await listRoutineEvents(accessToken)) {
    const routineId = event.extendedProperties?.private?.routineId;
    if (!event.id || !routineId) continue;
    if (routineIds.has(routineId)) continue;
    const deleted = await googleApiRequest(
      `/calendars/primary/events/${encodeURIComponent(event.id)}`,
      accessToken,
      { method: 'DELETE' },
    );
    if (
      !deleted.response.ok &&
      deleted.response.status !== 404 &&
      deleted.response.status !== 410
    ) {
      throw new ApiError(502, `Google Calendar event removal failed (${deleted.response.status}).`);
    }
  }
}

export async function sync(userId: string): Promise<{ synced: number; skipped: number }> {
  const connection = await CalendarConnection.findOne({
    where: { userId, provider: 'google', status: 'connected' },
  });
  if (!connection) throw ApiError.badRequest('Connect Google Calendar before syncing routines.');

  const routines = await Routine.findAll({ where: { userId, status: 'active' } });
  const token = await getValidAccessToken(connection);
  let synced = 0;
  for (const routine of routines) {
    if (await upsertRoutineEvent(routine, connection.timeZone, token)) synced += 1;
  }
  await deleteStaleRoutineEvents(
    token,
    new Set(
      routines
        .map((routine) => toGoogleEvent(routine, connection.timeZone))
        .filter((event): event is GoogleEvent => event !== null)
        .map((event) => event.extendedProperties.private.routineId),
    ),
  );
  return { synced, skipped: routines.length - synced };
}
