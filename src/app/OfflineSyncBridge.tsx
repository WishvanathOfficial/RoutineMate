import { useEffect } from 'react';
import { syncOfflineCheckInsThunk } from '@features/routines/routines.thunks';
import { toastShown } from '@features/ui/ui.slice';
import { useAppDispatch } from './hooks';

/**
 * Mounted once at the app root (see main.tsx), alongside AuthSessionBridge.
 *
 * Replays any check-ins queued while offline (see
 * src/offline/offlineCheckInQueue.ts) as soon as the app can reach the
 * network again: once on mount (covers reopening the app after an offline
 * session ended) and again on every browser 'online' event (covers
 * reconnecting mid-session). A queued entry that still fails to sync (e.g.
 * still offline) is simply left for the next trigger.
 */
export default function OfflineSyncBridge() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const sync = async () => {
      const result = await dispatch(syncOfflineCheckInsThunk());
      if (syncOfflineCheckInsThunk.fulfilled.match(result) && result.payload.length > 0) {
        const count = result.payload.length;
        dispatch(toastShown(`Synced ${count} offline check-in${count === 1 ? '' : 's'} 🔄`));
      }
    };

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [dispatch]);

  return null;
}
