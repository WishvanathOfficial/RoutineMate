// docs/RoutineMate-MVP2-Scope.md §3.6 "PWA/Offline Support — queue check-in
// taps made while offline and sync them once the connection returns."
//
// public/sw.js deliberately never intercepts `/api/*` requests, so a
// check-in POST made while offline simply fails at the network layer —
// this module is where that failure gets turned into "keep it, try again
// later" instead of "show an error and lose the tap". It's a thin
// IndexedDB-backed queue, keyed by routineId (one pending check-in per
// routine at a time — a second offline tap on the same routine before the
// first syncs just overwrites the queued status, matching the toggle's own
// "always represents the latest tap" semantics).
//
// No dependency: raw indexedDB, guarded so environments without it (very
// old browsers, some test runners) degrade to a no-op queue rather than
// throwing.

export interface QueuedCheckIn {
  routineId: string;
  status: 'done' | 'skipped';
  queuedAt: number;
}

const DB_NAME = 'routinemate-offline';
const DB_VERSION = 1;
const STORE_NAME = 'checkin-queue';

function isSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'routineId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queues (or overwrites) the pending check-in for a routine. Never throws. */
export async function queueCheckIn(routineId: string, status: 'done' | 'skipped'): Promise<void> {
  if (!isSupported()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ routineId, status, queuedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best-effort — if IndexedDB is unavailable/blocked, the check-in is
    // simply lost on reconnect rather than crashing the check-in flow.
  }
}

/** Returns every queued check-in, oldest first. */
export async function getQueuedCheckIns(): Promise<QueuedCheckIn[]> {
  if (!isSupported()) return [];
  try {
    const db = await openDb();
    const items = await new Promise<QueuedCheckIn[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as QueuedCheckIn[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return items.sort((a, b) => a.queuedAt - b.queuedAt);
  } catch {
    return [];
  }
}

/** Removes a routine's queued check-in once it has synced successfully. */
export async function removeQueuedCheckIn(routineId: string): Promise<void> {
  if (!isSupported()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(routineId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best-effort — worst case it's retried again next sync and no-ops
    // server-side (check-in is idempotent per routine/day).
  }
}
