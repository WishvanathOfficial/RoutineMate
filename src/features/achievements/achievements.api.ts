import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { Achievement, UserXp } from './achievements.types';

// Real backend call — see backend/src/services/achievements.service.ts. The
// response shape ({ items, xp }) matches the frontend types exactly (the
// service computes dynamic "N more to go" progressLabel text and the
// level/XP breakdown server-side), so no mapper is needed here.

export async function fetchAchievements(): Promise<{ items: Achievement[]; xp: UserXp }> {
  return httpClient.get('/api/achievements').then(unwrap<{ items: Achievement[]; xp: UserXp }>);
}
