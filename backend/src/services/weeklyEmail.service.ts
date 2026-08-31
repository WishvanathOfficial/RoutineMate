import { Op } from 'sequelize';
import { HabitLog, Routine, User, UserPreferences } from '../models';
import { isExpectedDay } from './routines.service';
import { sendMail } from './mail.service';
import { logger } from '../utils/logger';

// docs/RoutineMate-MVP2-Scope.md §3.7 "weekly summary email" — a digest of
// the trailing 7 days sent to users who've opted into `weeklyEmailEnabled`
// (see profile.slice.ts/ProfilePage.tsx, which already exposed that toggle
// before this sweep existed to act on it).
//
// Unlike the daily digest in notificationGenerator.service.ts, a weekly
// cadence is too long to dedupe with a single exact-minute match (a missed
// tick — e.g. a brief restart — could otherwise skip a whole week). Instead
// this persists `weeklyEmailLastSentAt` on UserPreferences and sends
// whenever it's been at least WEEKLY_EMAIL_MIN_INTERVAL_DAYS since the last
// send, checked once/day at WEEKLY_EMAIL_HOUR_MINUTE.

const WEEKLY_EMAIL_HOUR_MINUTE = '09:00';
const WEEKLY_EMAIL_MIN_INTERVAL_DAYS = 7;

function localHHMM(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function isAtOrAfterWeeklySendTime(now: Date): boolean {
  return localHHMM(now) >= WEEKLY_EMAIL_HOUR_MINUTE;
}

function isoDateDaysAgo(now: Date, n: number): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

interface WeeklyStats {
  completed: number;
  expected: number;
  activeRoutines: number;
  bestStreak: number;
}

async function computeWeeklyStats(userId: string, now: Date): Promise<WeeklyStats> {
  const routines = await Routine.findAll({ where: { userId } });
  const activeRoutines = routines.filter((r) => r.status === 'active').length;
  const bestStreak = routines.reduce((max, r) => Math.max(max, r.longestStreak), 0);

  const active = routines.filter((r) => r.status === 'active');
  if (active.length === 0) return { completed: 0, expected: 0, activeRoutines, bestStreak };

  const since = isoDateDaysAgo(now, 6);
  const logs = await HabitLog.findAll({
    where: { routineId: active.map((r) => r.id), date: { [Op.gte]: since }, status: 'done' },
  });

  let expected = 0;
  for (let i = 0; i <= 6; i += 1) {
    const day = isoDateDaysAgo(now, i);
    expected += active.filter((r) => isExpectedDay(r, day)).length;
  }

  return { completed: logs.length, expected, activeRoutines, bestStreak };
}

function buildEmailBody(firstName: string, stats: WeeklyStats): string {
  const rate = stats.expected > 0 ? Math.round((stats.completed / stats.expected) * 100) : 0;
  return [
    `Hi ${firstName},`,
    '',
    "Here's your RoutineMate weekly summary:",
    `- Check-ins completed: ${stats.completed} of ${stats.expected} expected (${rate}%)`,
    `- Active routines: ${stats.activeRoutines}`,
    `- Best streak: ${stats.bestStreak} day${stats.bestStreak === 1 ? '' : 's'}`,
    '',
    'Keep it up!',
    '— RoutineMate',
  ].join('\n');
}

/** Runs the weekly-email sweep. Returns the number of emails sent. */
export async function runWeeklyEmailSweep(now: Date = new Date()): Promise<number> {
  if (!isAtOrAfterWeeklySendTime(now)) return 0;

  const optedIn = await UserPreferences.findAll({ where: { weeklyEmailEnabled: true } });
  if (optedIn.length === 0) return 0;

  const cutoff = new Date(now.getTime() - WEEKLY_EMAIL_MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  const due = optedIn.filter((p) => !p.weeklyEmailLastSentAt || p.weeklyEmailLastSentAt <= cutoff);
  if (due.length === 0) return 0;

  const users = await User.findAll({ where: { id: due.map((p) => p.userId) } });
  const userById = new Map(users.map((u) => [u.id, u]));

  let sent = 0;
  for (const pref of due) {
    const user = userById.get(pref.userId);
    if (!user) continue;

    try {
      const stats = await computeWeeklyStats(pref.userId, now);
      await sendMail({
        to: user.email,
        subject: 'Your RoutineMate weekly summary',
        text: buildEmailBody(user.name.split(' ')[0], stats),
      });
      pref.weeklyEmailLastSentAt = now;
      await pref.save();
      sent += 1;
    } catch (err) {
      // Isolated per-user, same reasoning as notificationGenerator.service's
      // per-generator try/catch — one user's bad data shouldn't block the rest.
      logger.error(`Weekly email failed for user ${pref.userId}:`, err);
    }
  }
  return sent;
}
