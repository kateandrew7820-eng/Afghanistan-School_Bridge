import { supabase } from '@/integrations/supabase/client';

export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_MIME_PREFIXES = [
  'image/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'text/',
];

export function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileKindIcon(mime: string): 'image' | 'pdf' | 'doc' | 'sheet' | 'slide' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('sheet') || mime.includes('excel')) return 'sheet';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'slide';
  if (mime.includes('word') || mime.includes('document')) return 'doc';
  return 'file';
}

export async function uploadChatAttachment(
  conversationId: string,
  file: File,
): Promise<{ path: string; signedUrl: string | null }> {
  const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${conversationId}/${crypto.randomUUID()}-${cleanName}`;
  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: signed } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
  return { path, signedUrl: signed?.signedUrl ?? null };
}

export async function getAttachmentSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
