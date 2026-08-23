// Deliberately NOT part of Redux state and NOT persisted to localStorage/
// sessionStorage — the access token only ever needs to live in memory for
// the lifetime of the tab. Session persistence across reloads comes from
// the httpOnly refresh-token cookie (see httpClient.ts + auth bootstrap),
// not from storing this token anywhere durable.
//
// Kept as a standalone module (no Redux/store import) so httpClient.ts can
// read/write it without creating a circular import: store -> auth.slice ->
// auth.thunks -> auth.api -> httpClient -> (would-be) store.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
