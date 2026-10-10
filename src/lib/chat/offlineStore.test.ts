import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mocks.from,
  },
}));

import {
  cacheChatContacts,
  listQueuedChatMessages,
  queueChatMessage,
  readCachedChatContacts,
  syncQueuedChatMessages,
} from './offlineStore';

describe('offline chat storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.insert.mockResolvedValue({ error: null });
  });

  it('caches contacts per user', async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const contacts = [{
      user_id: `contact-${crypto.randomUUID()}`,
      email: 'contact@example.org',
      full_name: 'Saved contact',
      role: 'member',
    }];

    await cacheChatContacts(userId, contacts);

    expect(await readCachedChatContacts(userId)).toEqual(contacts);
    expect(await readCachedChatContacts(`other-${userId}`)).toEqual([]);
  });

  it('keeps an outgoing message in the outbox until the server accepts it', async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const message = await queueChatMessage({
      id: crypto.randomUUID(),
      userId,
      conversationId: crypto.randomUUID(),
      body: 'Offline message',
      attachmentName: null,
      attachmentMime: null,
      attachmentSize: null,
      createdAt: new Date().toISOString(),
    });

    expect(message.status).toBe('pending');
    expect((await listQueuedChatMessages(userId)).map(({ id }) => id)).toContain(message.id);

    await syncQueuedChatMessages(userId);

    expect(mocks.from).toHaveBeenCalledWith('messages');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: message.id,
      sender_id: userId,
      body: 'Offline message',
    }));
    expect((await listQueuedChatMessages(userId)).find(({ id }) => id === message.id)?.status).toBe('synced');
  });
});
