import { supabase } from '@/integrations/supabase/client';

export type OfflineSubmissionKind = 'form' | 'statistics' | 'report' | 'profile';
export type OfflineSubmissionStatus = 'pending' | 'failed' | 'synced';

export interface OfflineSubmission {
  id: string;
  userId: string;
  kind: OfflineSubmissionKind;
  payload: Record<string, unknown>;
  file?: Blob;
  fileName?: string;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextAttemptAt: number;
  status: OfflineSubmissionStatus;
  lastError?: string;
}

export interface QueuedSubmissionResult {
  id: string;
  status: OfflineSubmissionStatus;
}

const DATABASE_NAME = 'schoolbridge-offline';
const DATABASE_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const SUBMISSIONS_STORE = 'submissions';
const MAX_RETRY_DELAY = 6 * 60 * 60 * 1000;
const RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000;
let databasePromise: Promise<IDBDatabase> | undefined;
let syncPromise: Promise<void> | undefined;
let persistenceRequested = false;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }

  if (!databasePromise) {
    if (!persistenceRequested) {
      persistenceRequested = true;
      if (navigator.storage?.persist) {
        void navigator.storage.persist().then((persisted) => {
          if (!persisted) console.warn('The browser may evict offline data when device storage is low.');
        }).catch((error: unknown) => {
          console.warn('Could not request persistent browser storage:', error);
        });
      }
    }
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(DRAFTS_STORE)) {
          database.createObjectStore(DRAFTS_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(SUBMISSIONS_STORE)) {
          database.createObjectStore(SUBMISSIONS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error('Could not open the offline database.'));
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error('The offline database is blocked by another browser tab.'));
      };
    });
  }

  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Offline database request failed.'));
  });
}

export async function readDraft<T>(key: string): Promise<T | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFTS_STORE, 'readonly');
  const entry = await requestResult(transaction.objectStore(DRAFTS_STORE).get(key)) as
    { key: string; value: T } | undefined;
  return entry?.value;
}

export async function writeDraft<T>(key: string, value: T): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFTS_STORE, 'readwrite');
  transaction.objectStore(DRAFTS_STORE).put({ key, value, updatedAt: Date.now() });
  await transactionDone(transaction);
}

export async function deleteDraft(key: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(DRAFTS_STORE, 'readwrite');
  transaction.objectStore(DRAFTS_STORE).delete(key);
  await transactionDone(transaction);
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Offline database transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Offline database transaction was aborted.'));
  });
}

function notifyQueueChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('schoolbridge-offline-queue-change'));
  }
}

function createSubmissionId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function enqueueSubmission(
  submission: Pick<OfflineSubmission, 'userId' | 'kind' | 'payload' | 'file' | 'fileName'>,
): Promise<OfflineSubmission> {
  const now = Date.now();
  const entry: OfflineSubmission = {
    ...submission,
    id: createSubmissionId(),
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    nextAttemptAt: now,
    status: 'pending',
  };
  const database = await openDatabase();
  const transaction = database.transaction(SUBMISSIONS_STORE, 'readwrite');
  transaction.objectStore(SUBMISSIONS_STORE).add(entry);
  await transactionDone(transaction);
  notifyQueueChanged();
  return entry;
}

export async function queueSubmissionForSync(
  submission: Pick<OfflineSubmission, 'userId' | 'kind' | 'payload' | 'file' | 'fileName'>,
): Promise<QueuedSubmissionResult> {
  const entry = await enqueueSubmission(submission);
  if (await isBackendReachable()) {
    await syncOfflineSubmissions(entry.userId);
  } else {
    await requestBackgroundSync().catch((error: unknown) => {
      console.warn('Background sync could not be scheduled; the app will retry when reopened:', error);
    });
  }

  const updated = (await getOfflineSubmissions()).find((item) => item.id === entry.id);
  return { id: entry.id, status: updated?.status ?? 'pending' };
}

export async function getOfflineSubmissions(): Promise<OfflineSubmission[]> {
  const database = await openDatabase();
  const transaction = database.transaction(SUBMISSIONS_STORE, 'readonly');
  const entries = await requestResult(transaction.objectStore(SUBMISSIONS_STORE).getAll()) as OfflineSubmission[];
  return entries.sort((a, b) => a.createdAt - b.createdAt);
}

async function updateSubmission(id: string, changes: Partial<OfflineSubmission>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(SUBMISSIONS_STORE, 'readwrite');
  const store = transaction.objectStore(SUBMISSIONS_STORE);
  const entry = await requestResult(store.get(id)) as OfflineSubmission | undefined;
  if (entry) store.put({ ...entry, ...changes, updatedAt: Date.now() });
  await transactionDone(transaction);
  notifyQueueChanged();
}

function retryDelay(attempts: number): number {
  const base = Math.min(5_000 * (2 ** Math.min(attempts, 10)), 5 * 60_000, MAX_RETRY_DELAY);
  return Math.round(base * (0.8 + Math.random() * 0.4));
}

/** Ask the browser not to evict queued offline work. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch (error) {
    console.warn('Persistent storage is unavailable:', error);
  }
}

class InvalidOfflineSubmissionError extends Error {
  readonly permanent = true;
}

function isPermanentError(error: { code?: string; status?: number; permanent?: boolean }): boolean {
  if (error.permanent) return true;
  if (error.code === '23505') return false;
  return typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429;
}

async function sendSubmission(entry: OfflineSubmission): Promise<void> {
  if (entry.kind === 'profile') {
    const { error } = await supabase.from('profiles').upsert({
      user_id: requiredString(entry.payload, 'user_id'),
      full_name: requiredString(entry.payload, 'full_name'),
      district: requiredString(entry.payload, 'district'),
      province: requiredString(entry.payload, 'province'),
      role: requiredString(entry.payload, 'role'),
      school_name: requiredString(entry.payload, 'school_name'),
      school_id: typeof entry.payload.school_id === 'string' ? entry.payload.school_id : null,
      phone_number: nullableStringValue(entry.payload, 'phone_number'),
      status: 'pending_verification',
      updated_at: requiredString(entry.payload, 'updated_at'),
    }, { onConflict: 'user_id' });
    if (error) throw error;
    return;
  }

  if (entry.kind === 'form') {
    const formData = entry.payload.form_data;
    if (!isStringRecord(formData)) {
      throw new InvalidOfflineSubmissionError('The queued form data is invalid.');
    }
    const { error } = await supabase.from('form_submissions').insert({
      id: entry.id,
      school_id: requiredString(entry.payload, 'school_id'),
      submitted_by: requiredString(entry.payload, 'submitted_by'),
      form_type: requiredString(entry.payload, 'form_type'),
      form_data: formData,
    });
    if (error && error.code !== '23505') throw error;
    return;
  }

  if (entry.kind === 'statistics') {
    const { error } = await supabase.from('statistics_submissions').insert({
      id: entry.id,
      school_id: requiredString(entry.payload, 'school_id'),
      submitted_by: requiredString(entry.payload, 'submitted_by'),
      academic_year: requiredString(entry.payload, 'academic_year'),
      total_students: numberValue(entry.payload, 'total_students'),
      male_students: numberValue(entry.payload, 'male_students'),
      female_students: numberValue(entry.payload, 'female_students'),
      total_teachers: numberValue(entry.payload, 'total_teachers'),
      attendance_rate: nullableNumberValue(entry.payload, 'attendance_rate'),
      notes: nullableStringValue(entry.payload, 'notes'),
    });
    if (error && error.code !== '23505') throw error;
    return;
  }

  if (!entry.file || !entry.fileName) {
    throw new InvalidOfflineSubmissionError('The queued report is missing its attached file.');
  }

  const extension = entry.fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const filePath = `${entry.payload.school_id}/${entry.id}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('school-reports')
    .upload(filePath, entry.file, { upsert: true });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from('report_submissions').insert({
    id: entry.id,
    school_id: requiredString(entry.payload, 'school_id'),
    submitted_by: requiredString(entry.payload, 'submitted_by'),
    title: requiredString(entry.payload, 'title'),
    description: nullableStringValue(entry.payload, 'description'),
    file_path: filePath,
    file_name: entry.fileName,
  });
  if (error && error.code !== '23505') throw error;
}

function requiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== 'string' || !value) {
    throw new InvalidOfflineSubmissionError(`The queued submission is missing ${key}.`);
  }
  return value;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string');
}

function nullableStringValue(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new InvalidOfflineSubmissionError(`The queued submission has an invalid ${key}.`);
  }
  return value;
}

function numberValue(payload: Record<string, unknown>, key: string): number {
  const value = payload[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidOfflineSubmissionError(`The queued submission has an invalid ${key}.`);
  }
  return value;
}

function nullableNumberValue(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidOfflineSubmissionError(`The queued submission has an invalid ${key}.`);
  }
  return value;
}

export async function syncOfflineSubmissions(userId: string): Promise<void> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const entries = await getOfflineSubmissions();
    const now = Date.now();

    for (const entry of entries) {
      if (entry.status === 'synced') {
        if (now - entry.updatedAt > RETENTION_PERIOD) {
          const database = await openDatabase();
          const transaction = database.transaction(SUBMISSIONS_STORE, 'readwrite');
          transaction.objectStore(SUBMISSIONS_STORE).delete(entry.id);
          await transactionDone(transaction);
        }
        continue;
      }
      if (entry.userId !== userId || entry.status === 'failed' || entry.nextAttemptAt > Date.now()) continue;

      try {
        await sendSubmission(entry);
        await updateSubmission(entry.id, { status: 'synced', lastError: undefined });
      } catch (error) {
        const issue = error as { code?: string; status?: number; message?: string; permanent?: boolean };
        const attempts = entry.attempts + 1;
        await updateSubmission(entry.id, {
          attempts,
          status: isPermanentError(issue) ? 'failed' : 'pending',
          nextAttemptAt: Date.now() + retryDelay(attempts),
          lastError: issue.message || 'Unable to sync this submission.',
        });
        if (!navigator.onLine ||
            (!issue.permanent && (typeof issue.status !== 'number' ||
              issue.status >= 500 || issue.status === 408 || issue.status === 429))) break;
      }
    }
  })().finally(() => {
    syncPromise = undefined;
  });

  return syncPromise;
}

export async function retryOfflineSubmission(id: string): Promise<void> {
  await updateSubmission(id, { status: 'pending', nextAttemptAt: Date.now(), lastError: undefined });
}

export async function requestBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return;
  const syncRegistration = registration as ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
  };
  if (syncRegistration.sync) {
    await syncRegistration.sync.register('schoolbridge-submissions');
  }
}

export async function isBackendReachable(timeoutMs = 3000): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return false;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.status < 500;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
