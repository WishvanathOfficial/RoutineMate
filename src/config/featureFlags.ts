/** MVP3 flags default to off so unfinished screens cannot be reached accidentally. */
export const featureFlags = {
  challenges: import.meta.env.VITE_FEATURE_CHALLENGES === 'true',
  friends: import.meta.env.VITE_FEATURE_FRIENDS === 'true',
  routineBundles: import.meta.env.VITE_FEATURE_ROUTINE_BUNDLES === 'true',
  focusTimer: import.meta.env.VITE_FEATURE_FOCUS_TIMER === 'true',
  calendarSync: import.meta.env.VITE_FEATURE_CALENDAR_SYNC === 'true',
  aiInsights: import.meta.env.VITE_FEATURE_AI_INSIGHTS === 'true',
  feedback: import.meta.env.VITE_FEATURE_FEEDBACK === 'true',
  billing: import.meta.env.VITE_FEATURE_BILLING === 'true',
  localization: import.meta.env.VITE_FEATURE_LOCALIZATION === 'true',
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
