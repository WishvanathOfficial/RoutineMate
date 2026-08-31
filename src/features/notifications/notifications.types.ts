// MVP-2: Notification Center — see docs/RoutineMate-MVP2-Scope.md §3.5.
// The Topbar bell becomes functional: dropdown history of reminders fired,
// achievements unlocked, and streak-at-risk warnings, plus a daily digest.

export type NotificationType = 'achievement' | 'reminder' | 'streak_risk' | 'digest' | 'nudge';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  timeLabel: string;
  read: boolean;
  createdAt: string;
  /** Reminder notifications can be snoozed 30 minutes; others cannot. */
  snoozeable: boolean;
}

export type NotificationsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface NotificationsState {
  items: AppNotification[];
  status: NotificationsStatus;
  error: string | null;
}

export interface NotificationVisual {
  icon: string;
  colorClass: 'amber' | 'brand' | 'rose' | 'emerald';
}

const VISUALS: Record<NotificationType, NotificationVisual> = {
  achievement: { icon: 'fa-solid fa-trophy', colorClass: 'amber' },
  reminder: { icon: 'fa-solid fa-clock', colorClass: 'brand' },
  streak_risk: { icon: 'fa-solid fa-triangle-exclamation', colorClass: 'rose' },
  digest: { icon: 'fa-solid fa-list-check', colorClass: 'emerald' },
  nudge: { icon: 'fa-solid fa-clock-rotate-left', colorClass: 'brand' },
};

export function notificationVisual(type: NotificationType): NotificationVisual {
  return VISUALS[type];
}
