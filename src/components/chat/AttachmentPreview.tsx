import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File, Download } from 'lucide-react';
import { fileKindIcon, humanFileSize, getAttachmentSignedUrl } from '@/lib/chat/attachments';

interface Props {
  path: string;
  name: string;
  mime: string;
  size: number | null;
}

const kindIcons = {
  image: ImageIcon,
  pdf: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  doc: FileText,
  file: File,
};

export function AttachmentPreview({ path, name, mime, size }: Props) {
  const kind = fileKindIcon(mime);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAttachmentSignedUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  if (kind === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[280px]">
        <img
          src={url}
          alt={name}
          className="rounded-lg max-h-64 w-auto object-cover border border-border"
          loading="lazy"
        />
      </a>
    );
  }

  const Icon = kindIcons[kind];
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 max-w-[280px] hover:bg-muted transition-colors"
    >
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{size ? humanFileSize(size) : ''}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground shrink-0" />
    </a>
  );
}
