import { runNotificationSweep } from '../services/notificationGenerator.service';
import { runWeeklyEmailSweep } from '../services/weeklyEmail.service';
import { logger } from '../utils/logger';

// docs/RoutineMate-MVP2-Scope.md §6 "Notification-generation engine".
//
// A plain `setInterval` rather than a cron library: the generators already
// do their own exact-minute matching (reminder fire time, digest fire
// hour/minute) and their own dedupe (see notificationGenerator.service.ts),
// so all the scheduler needs to guarantee is "call the sweep at least once
// per matching minute" — a 60s interval satisfies that without pulling in
// a new dependency for a single-process backend with no existing job
// infrastructure. If RoutineMate ever runs multiple API instances, this
// will need to move to a single designated worker (or a real queue) to
// avoid duplicate sweeps — out of scope for this phase.

const SWEEP_INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function tick(): Promise<void> {
  try {
    const result = await runNotificationSweep();
    if (result.errors.length > 0) {
      logger.warn('Notification sweep completed with errors:', result.errors);
    }
    if (result.reminders || result.streakRisks || result.digests || result.nudges) {
      logger.info(
        `Notification sweep: ${result.reminders} reminder(s), ${result.streakRisks} streak-risk warning(s), ${result.digests} digest(s), ${result.nudges} nudge(s).`,
      );
    }
  } catch (err) {
    // runNotificationSweep already isolates its four generators internally —
    // this catch is a last-resort backstop so a scheduler tick never crashes
    // the process (e.g. if the DB connection drops mid-sweep).
    logger.error('Notification sweep failed unexpectedly:', err);
  }

  try {
    const sent = await runWeeklyEmailSweep();
    if (sent > 0) {
      logger.info(`Weekly email sweep: sent ${sent} email(s).`);
    }
  } catch (err) {
    logger.error('Weekly email sweep failed unexpectedly:', err);
  }
}

/** Starts the recurring sweep. Safe to call once at process bootstrap. */
export function startNotificationScheduler(): void {
  if (intervalHandle) return; // already running
  intervalHandle = setInterval(tick, SWEEP_INTERVAL_MS);
  intervalHandle.unref?.(); // don't keep the process alive solely for this timer
  logger.info('Notification scheduler started (60s interval).');
}

/** Stops the recurring sweep. Used by tests and graceful shutdown. */
export function stopNotificationScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
