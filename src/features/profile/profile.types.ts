import type { Locale } from '../../i18n/catalog';

export interface ProfilePreferences {
  pushRemindersEnabled: boolean;
  dailyDigestEnabled: boolean;
  weeklyEmailEnabled: boolean;
  language: Locale;
  units: 'metric' | 'imperial';
}

export interface AccountUpdateInput {
  name: string;
  email: string;
}

export type ProfileStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProfileState {
  preferences: ProfilePreferences;
  status: ProfileStatus;
  error: string | null;
}
