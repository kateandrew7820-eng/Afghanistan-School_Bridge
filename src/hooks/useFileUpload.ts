import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useErrorToast } from '@/lib/errorToast';
import { useToast } from '@/hooks/use-toast';

interface FileUploadOptions {
  bucket: string;
  path: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (filePath: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showErrorMessage } = useErrorToast();
  const { toast } = useToast();

  const uploadFile = useCallback(
    async (file: File, options: FileUploadOptions): Promise<string | null> => {
      try {
        setUploading(true);
        setProgress(0);

        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setProgress((prev) => (prev < 90 ? prev + Math.random() * 30 : prev));
        }, 200);

        const { data, error } = await supabase.storage
          .from(options.bucket)
          .upload(options.path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        clearInterval(progressInterval);
        setProgress(100);

        if (error) {
          throw error;
        }

        setProgress(100);
        options.onSuccess?.(data.path);
        return data.path;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('خطا در آپلود');
        showErrorMessage(err.message, 'خطا');
        options.onError?.(err);
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [showErrorMessage]
  );

  const deleteFile = useCallback(
    async (bucket: string, path: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (error) {
          throw error;
        }

        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('خطا در حذف فایل');
        showErrorMessage(err.message, 'خطا');
        return false;
      }
    },
    [showErrorMessage]
  );

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
}
