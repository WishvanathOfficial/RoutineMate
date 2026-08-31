import { ApiError } from './ApiError';

/** Reusable ownership guard for resources belonging to the authenticated user. */
export function assertOwner(
  ownerId: string,
  userId: string,
  message = 'You do not have access to this resource',
): void {
  if (ownerId !== userId) throw ApiError.forbidden(message);
}

/** Explicitly documents public/friends/private access decisions at service boundaries. */
export function canView(
  visibility: 'private' | 'friends' | 'public',
  ownerId: string,
  viewerId: string,
  areFriends = false,
): boolean {
  return (
    ownerId === viewerId || visibility === 'public' || (visibility === 'friends' && areFriends)
  );
}
