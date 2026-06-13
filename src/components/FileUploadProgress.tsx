import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProgressProps {
  onFileSelect?: (file: File) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (file: File) => void;
  onUploadError?: (error: Error) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  onFileSelect,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (f: File): string | null => {
    // Check file size
    if (f.size > maxFileSize) {
      return `اندازه فایل باید کمتر از ${Math.round(maxFileSize / 1024 / 1024)}MB باشد`;
    }

    // Check file type by extension
    const fileExt = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExt)) {
      return `فقط فورمت‌های ${acceptedFileTypes.join(', ')} پشتیبانی می‌شوند`;
    }

    return null;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const validationError = validateFile(f);
      
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(f);
      setError(null);
      setUploadComplete(false);
      onFileSelect?.(f);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const validationError = validateFile(f);
      
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(f);
      setError(null);
      setUploadComplete(false);
      onFileSelect?.(f);
    }
  };

  const simulateUpload = () => {
    if (!file) return;

    setUploading(true);
    onUploadStart?.();
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 200);

    // Complete upload after a delay
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
      setUploadComplete(true);
      onUploadComplete?.(file);
      clearInterval(interval);
    }, 2000);
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    setUploadComplete(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      {!file ? (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'relative rounded-lg border-2 border-dashed transition-all py-8 px-4',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted hover:border-primary hover:bg-primary/5',
              error && 'border-destructive/20 bg-destructive/10'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              accept={acceptedFileTypes.join(',')}
              disabled={uploading}
            />

            <div className="text-center space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  فایل خود را اینجا رها کنید یا
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline mx-1"
                    disabled={uploading}
                  >
                    انتخاب کنید
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  فورمت‌های پشتیبانی شده: {acceptedFileTypes.join(', ')} (حداکثر {Math.round(maxFileSize / 1024 / 1024)}MB)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </>
      ) : (
        /* Selected File Display */
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                <p className="text-xs text-primary mt-1">{formatFileSize(file.size)}</p>
              </div>
              {!uploadComplete && !uploading && (
                <button
                  onClick={handleRemove}
                  className="text-primary hover:text-primary"
                  aria-label="حذف فایل"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {(uploading || uploadComplete) && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-primary">
                    {uploadComplete ? 'آپلود مکمل' : 'در حال آپلود...'}
                  </p>
                  <p className="text-xs text-primary">{Math.round(progress)}%</p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Complete */}
            {uploadComplete && (
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <p className="text-xs text-success">فایل با موفقیت آپلود شد</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!uploading && !uploadComplete && (
              <Button
                onClick={simulateUpload}
                size="sm"
                className="flex-1"
              >
                آپلود فایل
              </Button>
            )}
            {(uploading || uploadComplete) && !uploadComplete && (
              <Button
                onClick={handleRemove}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                حذف
              </Button>
            )}
            {uploadComplete && (
              <Button
                onClick={handleRemove}
                variant="outline"
                size="sm"
              >
                فایل دیگری
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
