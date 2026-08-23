import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { DashboardGreeting } from './dashboard.types';

// Real backend call — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.4 "Dashboard". GET /api/dashboard/greeting derives the name from the
// authenticated user server-side (via the JWT), so `name` is kept only for
// call-site/signature stability with dashboard.thunks.ts and isn't actually
// sent — the backend's response is the source of truth.
export async function fetchGreeting(_name: string): Promise<DashboardGreeting> {
  return httpClient.get('/api/dashboard/greeting').then(unwrap<DashboardGreeting>);
}
