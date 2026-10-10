import { supabase } from '@/integrations/supabase/client';
import { uploadChatAttachment } from '@/lib/chat/attachments';
import type { ConversationSummary } from '@/hooks/useConversations';
import type { ChatMessage } from '@/hooks/useMessages';

export interface ChatContact {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string | null;
}

export interface QueuedChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  body: string | null;
  attachmentName: string | null;
  attachmentMime: string | null;
  attachmentSize: number | null;
  file?: Blob;
  createdAt: string;
  attempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'failed' | 'synced';
  error?: string;
}

const DB_NAME = 'schoolbridge-chat';
const DB_VERSION = 1;
const CACHE_STORE = 'cache';
const MESSAGES_STORE = 'messages';
const OUTBOX_STORE = 'outbox';
const MESSAGE_CACHE_LIMIT = 200;
const MAX_RETRY_DELAY = 6 * 60 * 60 * 1000;
let dbPromise: Promise<IDBDatabase> | undefined;
let syncState: { userId: string; promise: Promise<void> } | undefined;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable.'));
  if (!dbPromise) {
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(CACHE_STORE)) {
          database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
          const store = database.createObjectStore(MESSAGES_STORE, { keyPath: 'key' });
          store.createIndex('cacheKey', 'cacheKey');
        }
        if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
          database.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = undefined;
        reject(request.error ?? new Error('Could not open chat storage.'));
      };
      request.onblocked = () => {
        dbPromise = undefined;
        reject(new Error('Chat storage is blocked by another browser tab.'));
      };
    });
    dbPromise = opening.catch((error: unknown) => {
      dbPromise = undefined;
      throw error;
    });
  }
  return dbPromise;
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Chat storage request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Chat storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Chat storage transaction aborted.'));
  });
}

function notifyQueue(): void {
  window.dispatchEvent(new Event('schoolbridge-chat-queue-change'));
}

async function putCache<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(CACHE_STORE, 'readwrite');
  transaction.objectStore(CACHE_STORE).put({ key, value, updatedAt: Date.now() });
  await transactionComplete(transaction);
}

async function readCache<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  const transaction = db.transaction(CACHE_STORE, 'readonly');
  const row = await requestValue(transaction.objectStore(CACHE_STORE).get(key)) as { value: T } | undefined;
  return row?.value;
}

export function cacheChatContacts(userId: string, contacts: ChatContact[]): Promise<void> {
  return putCache(`contacts:${userId}`, contacts);
}

export function readCachedChatContacts(userId: string): Promise<ChatContact[]> {
  return readCache<ChatContact[]>(`contacts:${userId}`).then((contacts) => contacts ?? []);
}

export function cacheConversations(userId: string, conversations: ConversationSummary[]): Promise<void> {
  return putCache(`conversations:${userId}`, conversations);
}

export function readCachedConversations(userId: string): Promise<ConversationSummary[]> {
  return readCache<ConversationSummary[]>(`conversations:${userId}`).then((conversations) => conversations ?? []);
}

function messageCacheKey(userId: string, conversationId: string): string {
  return `${userId}:${conversationId}`;
}

export async function cacheChatMessages(
  userId: string,
  conversationId: string,
  messages: ChatMessage[],
): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
  const store = transaction.objectStore(MESSAGES_STORE);
  const index = store.index('cacheKey');
  const cacheKey = messageCacheKey(userId, conversationId);
  const request = index.getAll(cacheKey);
  request.onsuccess = () => {
    const existing = request.result as { key: string; message: ChatMessage }[];
    const merged = new Map(existing.map((row) => [row.message.id, row.message]));
    messages.forEach((message) => merged.set(message.id, message));
    const recent = [...merged.values()]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-MESSAGE_CACHE_LIMIT);
    existing.forEach((row) => store.delete(row.key));
    recent.forEach((message) => store.put({
      key: `${cacheKey}:${message.id}`,
      cacheKey,
      message,
    }));
  };
  await transactionComplete(transaction);
}

export async function readCachedChatMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
  const db = await openDb();
  const transaction = db.transaction(MESSAGES_STORE, 'readonly');
  const rows = await requestValue(transaction.objectStore(MESSAGES_STORE).index('cacheKey')
    .getAll(messageCacheKey(userId, conversationId))) as { message: ChatMessage }[];
  return rows.map((row) => row.message).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function queueChatMessage(
  message: Omit<QueuedChatMessage, 'attempts' | 'nextAttemptAt' | 'status'>,
): Promise<QueuedChatMessage> {
  const entry: QueuedChatMessage = {
    ...message,
    attempts: 0,
    nextAttemptAt: Date.now(),
    status: 'pending',
  };
  const db = await openDb();
  const transaction = db.transaction(OUTBOX_STORE, 'readwrite');
  transaction.objectStore(OUTBOX_STORE).add(entry);
  await transactionComplete(transaction);
  notifyQueue();
  void requestChatBackgroundSync().catch((error: unknown) => {
    console.warn('Background chat sync could not be scheduled:', error);
  });
  return entry;
}

async function requestChatBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const syncRegistration = registration as (ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
  }) | undefined;
  await syncRegistration?.sync?.register('schoolbridge-chat-messages');
}

export async function listQueuedChatMessages(userId: string): Promise<QueuedChatMessage[]> {
  const db = await openDb();
  const transaction = db.transaction(OUTBOX_STORE, 'readonly');
  const rows = await requestValue(transaction.objectStore(OUTBOX_STORE).getAll()) as QueuedChatMessage[];
  return rows.filter((row) => row.userId === userId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function updateQueuedMessage(entry: QueuedChatMessage): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(OUTBOX_STORE, 'readwrite');
  transaction.objectStore(OUTBOX_STORE).put(entry);
  await transactionComplete(transaction);
  notifyQueue();
}

function retryDelay(attempts: number): number {
  return Math.min(30_000 * (2 ** Math.min(attempts, 10)), MAX_RETRY_DELAY);
}

function isPermanent(error: { code?: string; status?: number }): boolean {
  return typeof error.status === 'number' &&
    error.status >= 400 && error.status < 500 &&
    error.status !== 408 && error.status !== 429;
}

export async function syncQueuedChatMessages(userId: string): Promise<void> {
  if (syncState) {
    if (syncState.userId === userId) return syncState.promise;
    await syncState.promise;
    return syncQueuedChatMessages(userId);
  }
  const promise = (async () => {
    const entries = await listQueuedChatMessages(userId);
    for (const entry of entries) {
      if (entry.status !== 'pending' || entry.nextAttemptAt > Date.now()) continue;
      try {
        let attachmentPath: string | null = null;
        if (entry.file && entry.attachmentName) {
          const { path } = await uploadChatAttachment(
            entry.conversationId,
            typeof File === 'undefined'
              ? Object.assign(entry.file, { name: entry.attachmentName })
              : new File([entry.file], entry.attachmentName, { type: entry.attachmentMime ?? '' }),
            entry.id,
          );
          attachmentPath = path;
        }
        const { error } = await supabase.from('messages').insert({
          id: entry.id,
          conversation_id: entry.conversationId,
          sender_id: userId,
          body: entry.body,
          attachment_url: attachmentPath,
          attachment_name: entry.attachmentName,
          attachment_mime: entry.attachmentMime,
          attachment_size: entry.attachmentSize,
        });
        if (error && error.code !== '23505') throw error;
        await updateQueuedMessage({ ...entry, file: undefined, status: 'synced', error: undefined });
      } catch (error) {
        const issue = error as { code?: string; status?: number; message?: string };
        const attempts = entry.attempts + 1;
        await updateQueuedMessage({
          ...entry,
          attempts,
          status: isPermanent(issue) ? 'failed' : 'pending',
          nextAttemptAt: Date.now() + retryDelay(attempts),
          error: issue.message ?? 'پیام ارسال نشد.',
        });
        if (!navigator.onLine || !isPermanent(issue)) break;
      }
    }
  })();
  syncState = { userId, promise };
  try {
    await promise;
  } finally {
    if (syncState?.promise === promise) syncState = undefined;
  }
}

export async function retryQueuedChatMessage(id: string): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(OUTBOX_STORE, 'readwrite');
  const store = transaction.objectStore(OUTBOX_STORE);
  const entry = await requestValue(store.get(id)) as QueuedChatMessage | undefined;
  if (entry) {
    store.put({ ...entry, status: 'pending', nextAttemptAt: Date.now(), error: undefined });
  }
  await transactionComplete(transaction);
  notifyQueue();
}

export function queuedMessageToChatMessage(entry: QueuedChatMessage): ChatMessage {
  return {
    id: entry.id,
    conversation_id: entry.conversationId,
    sender_id: entry.userId,
    body: entry.body,
    attachment_url: null,
    attachment_name: entry.attachmentName,
    attachment_mime: entry.attachmentMime,
    attachment_size: entry.attachmentSize,
    reply_to_id: null,
    created_at: entry.createdAt,
    edited_at: null,
    deleted_at: null,
    read_by: [],
    local_state: entry.status,
  };
}
