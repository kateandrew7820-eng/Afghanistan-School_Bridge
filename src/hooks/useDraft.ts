import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDraft, readDraft, writeDraft } from '@/lib/offlineStore';

export type DraftSaveState = 'loading' | 'saving' | 'saved' | 'fallback' | 'error';

/**
 * Persists form values to IndexedDB and migrates existing localStorage drafts.
 * Returns [value, setValue, clear, hasDraft, saveState].
 */
export function useDraft<T extends Record<string, unknown>>(
  key: string,
  initial: T,
  legacyKey?: string,
) {
  const storageKey = `draft:${key}`;
  const legacyStorageKey = legacyKey ? `draft:${legacyKey}` : storageKey;
  const [value, setStoredValue] = useState<T>(initial);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveState, setSaveState] = useState<DraftSaveState>('loading');
  const [revision, setRevision] = useState(0);
  const revisionRef = useRef(0);
  const readyKey = useRef<string | null>(null);
  const initialValue = useRef(initial);
  initialValue.current = initial;

  useEffect(() => {
    let cancelled = false;
    readyKey.current = null;
    revisionRef.current = 0;
    setRevision(0);
    setSaveState('loading');
    setStoredValue(initialValue.current);
    setHasDraft(false);

    void (async () => {
      try {
        const saved = await readDraft<T>(storageKey);
        if (cancelled) return;

        if (saved) {
          if (revisionRef.current === 0) setStoredValue({ ...initialValue.current, ...saved });
          setHasDraft(true);
        } else {
          let sourceKey = storageKey;
          let legacy = localStorage.getItem(storageKey);
          if (!legacy && legacyStorageKey !== storageKey) {
            sourceKey = legacyStorageKey;
            legacy = localStorage.getItem(legacyStorageKey);
          }
          if (legacy) {
            const parsed = JSON.parse(legacy) as Partial<T>;
            if (revisionRef.current === 0) setStoredValue({ ...initialValue.current, ...parsed });
            setHasDraft(true);
            await writeDraft(storageKey, { ...initialValue.current, ...parsed });
            localStorage.removeItem(sourceKey);
          }
        }
        if (!cancelled) {
          readyKey.current = storageKey;
          setSaveState('saved');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Could not load the saved form draft:', error);
        readyKey.current = storageKey;
        setSaveState('error');
      }
    })();

    return () => { cancelled = true; };
  }, [legacyStorageKey, storageKey]);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>((next) => {
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setStoredValue(next);
  }, []);

  useEffect(() => {
    if (readyKey.current !== storageKey || revision === 0) return;

    let cancelled = false;
    setSaveState('saving');
    void writeDraft(storageKey, value).then(() => {
      if (cancelled) return;
      setHasDraft(true);
      setSaveState('saved');
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Could not remove the migrated form draft from localStorage:', error);
      }
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error('Could not save the form draft in IndexedDB:', error);
      if (containsBlob(value)) {
        console.error('The file attachment cannot be safely saved without IndexedDB.');
        setSaveState('error');
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
        setHasDraft(true);
        setSaveState('fallback');
      } catch (fallbackError) {
        console.error('Could not save the form draft in browser storage:', fallbackError);
        setSaveState('error');
      }
    });

    return () => { cancelled = true; };
  }, [revision, storageKey, value]);

  const clear = useCallback(() => {
    setStoredValue(initialValue.current);
    setHasDraft(false);
    revisionRef.current = 0;
    setRevision(0);
    void deleteDraft(storageKey).then(() => {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Could not remove the saved form draft from localStorage:', error);
      }
      setSaveState('saved');
    }).catch((error: unknown) => {
      console.error('Could not clear the saved form draft:', error);
      setSaveState('error');
    });
  }, [storageKey]);

  return [value, setValue, clear, hasDraft, saveState] as const;
}

function containsBlob(value: unknown): boolean {
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(containsBlob);
}
