import { CalendarConnection } from '../models';
export async function connections(userId: string) {
  return CalendarConnection.findAll({
    where: { userId },
    attributes: ['id', 'provider', 'status', 'expiresAt'],
  });
}
export function googleConnectUrl() {
  return process.env.GOOGLE_CALENDAR_CLIENT_ID
    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(process.env.GOOGLE_CALENDAR_CLIENT_ID)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar&response_type=code`
    : null;
}
export async function disconnect(userId: string, provider: 'google' | 'apple') {
  await CalendarConnection.destroy({ where: { userId, provider } });
}
export async function sync(userId: string) {
  const rows = await CalendarConnection.findAll({ where: { userId, status: 'connected' } });
  return { synced: rows.length, conflicts: [], retryable: rows.length > 0 };
}
