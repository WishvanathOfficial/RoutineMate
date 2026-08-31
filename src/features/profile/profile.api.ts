import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { User } from '@features/auth/auth.types';
import type { AccountUpdateInput, ProfilePreferences } from './profile.types';

// Real backend calls — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.6 "Profile".

interface BackendUserDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface BackendPreferencesDto {
  theme: 'light' | 'dark' | 'system';
  pushRemindersEnabled: boolean;
  dailyDigestEnabled: boolean;
  weeklyEmailEnabled: boolean;
  firstDayOfWeek: string;
}

/** GET /api/profile nests preferences under the Sequelize association alias. */
interface BackendProfileDto extends BackendUserDto {
  preferences: BackendPreferencesDto;
}

export interface ProfileSnapshot {
  user: User;
  preferences: ProfilePreferences;
}

function toUser(dto: BackendUserDto): User {
  return { id: dto.id, name: dto.name, email: dto.email, avatarUrl: dto.avatarUrl };
}

function toPreferences(dto: BackendPreferencesDto): ProfilePreferences {
  // `theme` and `firstDayOfWeek` are intentionally dropped — theme stays
  // fully client-side for MVP-1 (see plan §2.6 open decisions) and nothing
  // in the UI surfaces firstDayOfWeek yet.
  return {
    pushRemindersEnabled: dto.pushRemindersEnabled,
    dailyDigestEnabled: dto.dailyDigestEnabled,
    weeklyEmailEnabled: dto.weeklyEmailEnabled,
  };
}

export async function fetchProfile(): Promise<ProfileSnapshot> {
  const dto = await httpClient.get('/api/profile').then(unwrap<BackendProfileDto>);
  return { user: toUser(dto), preferences: toPreferences(dto.preferences) };
}

export async function updateAccount(input: AccountUpdateInput): Promise<AccountUpdateInput> {
  const dto = await httpClient.put('/api/profile', input).then(unwrap<BackendUserDto>);
  return { name: dto.name, email: dto.email };
}

export async function updatePreferences(
  preferences: ProfilePreferences,
): Promise<ProfilePreferences> {
  const dto = await httpClient
    .put('/api/profile/preferences', preferences)
    .then(unwrap<BackendPreferencesDto>);
  return toPreferences(dto);
}

export async function deleteAccount(): Promise<void> {
  await httpClient.delete('/api/profile');
}
