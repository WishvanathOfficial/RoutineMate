import type { RootState } from '@app/store';

export const selectPreferences = (state: RootState) => state.profile.preferences;
export const selectProfileStatus = (state: RootState) => state.profile.status;
