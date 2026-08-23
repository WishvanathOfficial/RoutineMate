import type { RootState } from '@app/store';

export const selectGreeting = (state: RootState) => state.dashboard.greeting;
export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
