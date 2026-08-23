import type { RootState } from '@app/store';

export const selectStatsSummary = (state: RootState) => state.stats.summary;
export const selectStatsStatus = (state: RootState) => state.stats.status;
