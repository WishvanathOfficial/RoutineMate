export interface ProfilePreferences {
  pushRemindersEnabled: boolean;
  dailyDigestEnabled: boolean;
  weeklyEmailEnabled: boolean;
}

export interface AccountUpdateInput {
  name: string;
  email: string;
}

export type ProfileStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProfileState {
  preferences: ProfilePreferences;
  status: ProfileStatus;
}
