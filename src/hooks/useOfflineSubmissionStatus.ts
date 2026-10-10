import { useEffect, useState } from 'react';
import {
  getOfflineSubmissions,
  type OfflineSubmissionStatus,
  type QueuedSubmissionResult,
} from '@/lib/offlineStore';

export function useOfflineSubmissionStatus(
  submission: QueuedSubmissionResult | null,
): OfflineSubmissionStatus | null {
  const [status, setStatus] = useState<OfflineSubmissionStatus | null>(submission?.status ?? null);
  const submissionId = submission?.id;
  const initialStatus = submission?.status;

  useEffect(() => {
    if (!submissionId || !initialStatus) {
      setStatus(null);
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        const entry = (await getOfflineSubmissions()).find(({ id }) => id === submissionId);
        if (active && entry) setStatus(entry.status);
      } catch (error) {
        console.error('Could not refresh this submission status:', error);
      }
    };

    setStatus(initialStatus);
    window.addEventListener('schoolbridge-offline-queue-change', refresh);
    void refresh();
    return () => {
      active = false;
      window.removeEventListener('schoolbridge-offline-queue-change', refresh);
    };
  }, [initialStatus, submissionId]);

  return submission ? status ?? submission.status : null;
}
