import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOfflineSubmissions,
  isBackendReachable,
  OfflineSubmission,
  requestBackgroundSync,
  retryOfflineSubmission,
  syncOfflineSubmissions,
} from '@/lib/offlineStore';
import { Button } from '@/components/ui/button';
import { syncQueuedChatMessages } from '@/lib/chat/offlineStore';

type ConnectionState = 'checking' | 'online' | 'offline';

export function OfflineStatus() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>('checking');
  const [submissions, setSubmissions] = useState<OfflineSubmission[]>([]);
  const [storageError, setStorageError] = useState(false);
  const [showSynced, setShowSynced] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      setSubmissions(await getOfflineSubmissions());
      setStorageError(false);
    } catch (error) {
      console.error('Could not read the offline submission queue:', error);
      setStorageError(true);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) setConnection('offline');
    const reachable = await isBackendReachable();
    setConnection(reachable ? 'online' : 'offline');
    if (reachable && user?.id) {
      try {
        await syncOfflineSubmissions(user.id);
        await syncQueuedChatMessages(user.id);
      } catch (error) {
        console.error('Could not sync offline work:', error);
      }
      await refreshQueue();
    }
  }, [refreshQueue, user?.id]);

  const pendingCount = submissions.filter((submission) =>
    submission.userId === user?.id && submission.status === 'pending'
  ).length;
  const failedCount = submissions.filter((submission) =>
    submission.userId === user?.id && submission.status === 'failed'
  ).length;
  const syncedCount = submissions.filter((submission) =>
    submission.userId === user?.id && submission.status === 'synced'
  ).length;

  useEffect(() => {
    const refresh = () => { void refreshQueue(); };
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCHOOLBRIDGE_SYNC_REQUESTED') void checkConnection();
    };
    const onOnline = () => { void checkConnection(); };
    const onOffline = () => {
      setConnection('offline');
      void checkConnection();
    };
    const interval = window.setInterval(() => { void checkConnection(); }, 20_000);

    window.addEventListener('schoolbridge-offline-queue-change', refresh);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onOnline);
    navigator.serviceWorker?.addEventListener('message', onWorkerMessage);
    void refreshQueue();
    void checkConnection();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('schoolbridge-offline-queue-change', refresh);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onOnline);
      navigator.serviceWorker?.removeEventListener('message', onWorkerMessage);
    };
  }, [checkConnection, refreshQueue]);

  useEffect(() => {
    if (!user?.id || connection !== 'online' || pendingCount === 0) return;
    void requestBackgroundSync().catch((error: unknown) => {
      console.warn('Background sync registration is unavailable:', error);
    });
  }, [connection, pendingCount, user?.id]);

  useEffect(() => {
    if (connection !== 'online' || pendingCount > 0 || syncedCount === 0) return;
    setShowSynced(true);
    const timer = window.setTimeout(() => setShowSynced(false), 5_000);
    return () => window.clearTimeout(timer);
  }, [connection, pendingCount, syncedCount]);

  const retryQueued = async () => {
    const retryable = submissions.filter((submission) =>
      submission.userId === user?.id &&
      (submission.status === 'failed' || submission.status === 'pending')
    );
    try {
      await Promise.all(retryable.map((submission) => retryOfflineSubmission(submission.id)));
      await refreshQueue();
      await checkConnection();
    } catch (error) {
      console.error('Could not retry failed offline submissions:', error);
      setStorageError(true);
    }
  };

  if (
    connection === 'checking' ||
    (connection === 'online' && pendingCount === 0 && failedCount === 0 && !storageError && !showSynced)
  ) return null;

  const message = storageError
    ? 'ذخیره‌سازی محلی در دسترس نیست. این صفحه را باز نگه دارید.'
    : connection === 'offline'
      ? `آفلاین — تغییرات به صورت محلی ذخیره شد${pendingCount ? ` · در انتظار همگام‌سازی: ${pendingCount}` : ''}`
      : failedCount
        ? `خطا در همگام‌سازی ${failedCount} مورد. داده‌ها روی این دستگاه محفوظ است.`
        : pendingCount
          ? `در انتظار همگام‌سازی: ${pendingCount} مورد`
          : 'همگام شد';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-sm ${
        storageError || failedCount
          ? 'bg-destructive/10 text-destructive'
          : connection === 'offline' || pendingCount
            ? 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'
            : 'bg-primary/10 text-primary'
      }`}
    >
      <span>{message}</span>
      {(failedCount > 0 || pendingCount > 0) && connection === 'online' && user && (
        <Button size="sm" variant="outline" onClick={() => void retryQueued()}>
          {failedCount > 0 ? 'تلاش دوباره' : 'همگام‌سازی اکنون'}
        </Button>
      )}
    </div>
  );
}
