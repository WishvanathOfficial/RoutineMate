import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { StatsSummary } from './stats.types';

// Real backend call — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.2 "Stats". The backend's stats.service.ts was written to return this
// exact shape (weekly/categoryBreakdown/trend30Day/timeOfDay), so this is a
// straight swap: no changes needed in stats.thunks.ts, stats.slice.ts,
// stats.selectors.ts, or StatsPage.tsx.
export async function fetchStatsSummary(): Promise<StatsSummary> {
  return httpClient.get('/api/stats/summary').then(unwrap<StatsSummary>);
}
