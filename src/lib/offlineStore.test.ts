import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mocks.from,
    storage: { from: mocks.storageFrom },
  },
}));

import {
  enqueueSubmission,
  getOfflineSubmissions,
  readDraft,
  retryOfflineSubmission,
  syncOfflineSubmissions,
  writeDraft,
} from './offlineStore';

describe('offline persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.storageFrom.mockReturnValue({ upload: mocks.upload });
    mocks.upload.mockResolvedValue({ error: null });
  });

  it('restores a saved form draft and preserves attached file blobs', async () => {
    const key = `draft:test-${crypto.randomUUID()}`;
    const file = new NodeBlob(['report bytes'], { type: 'application/pdf' }) as unknown as Blob;
    await writeDraft(key, { title: 'Monthly report', file });

    const restored = await readDraft<{ title: string; file: Blob }>(key);
    expect(restored?.title).toBe('Monthly report');
    expect(await restored?.file.text()).toBe('report bytes');
  });

  it('keeps queued submissions until the authenticated request succeeds', async () => {
    const userId = `user-${crypto.randomUUID()}`;
    const queued = await enqueueSubmission({
      userId,
      kind: 'form',
      payload: {
        school_id: 'school-1',
        submitted_by: userId,
        form_type: 'incident_report',
        form_data: { title: 'Road closure', details: 'Bridge is closed' },
      },
    });

    expect(queued.status).toBe('pending');
    await syncOfflineSubmissions(userId);

    const saved = (await getOfflineSubmissions()).find(({ id }) => id === queued.id);
    expect(saved?.status).toBe('synced');
    expect(mocks.from).toHaveBeenCalledWith('form_submissions');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: queued.id,
      submitted_by: userId,
      form_type: 'incident_report',
    }));
  });

  it('retains a report attachment in the outbox if the upload fails', async () => {
    const userId = `user-${crypto.randomUUID()}`;
    mocks.upload.mockResolvedValueOnce({ error: { status: 503, message: 'Storage unavailable' } });
    const queued = await enqueueSubmission({
      userId,
      kind: 'report',
      payload: {
        school_id: 'school-1',
        submitted_by: userId,
        title: 'Monthly report',
        description: null,
      },
      file: new NodeBlob(['report bytes'], { type: 'application/pdf' }) as unknown as Blob,
      fileName: 'report.pdf',
    });

    await syncOfflineSubmissions(userId);

    const saved = (await getOfflineSubmissions()).find(({ id }) => id === queued.id);
    expect(saved?.status).toBe('pending');
    expect(saved?.attempts).toBe(1);
    expect(saved?.nextAttemptAt).toBeGreaterThan(Date.now());
    expect(saved?.file).toBeInstanceOf(NodeBlob);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('marks permanent server errors for attention and permits a manual retry', async () => {
    const userId = `user-${crypto.randomUUID()}`;
    mocks.insert.mockResolvedValueOnce({ error: { status: 400, message: 'Invalid submission' } });
    const queued = await enqueueSubmission({
      userId,
      kind: 'form',
      payload: {
        school_id: 'school-1',
        submitted_by: userId,
        form_type: 'incident_report',
        form_data: { title: 'Incident', details: 'Details' },
      },
    });

    await syncOfflineSubmissions(userId);
    let saved = (await getOfflineSubmissions()).find(({ id }) => id === queued.id);
    expect(saved?.status).toBe('failed');
    expect(saved?.lastError).toBe('Invalid submission');

    await retryOfflineSubmission(queued.id);
    await syncOfflineSubmissions(userId);
    saved = (await getOfflineSubmissions()).find(({ id }) => id === queued.id);
    expect(saved?.status).toBe('synced');
  });
});
