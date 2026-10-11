import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import NavigationBackButton from '@/components/NavigationBackButton';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  category: string;
  created_at: string;
}

export default function SchoolDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      const { data } = await supabase
        .from('center_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setDocuments(data);
      setLoading(false);
    }

    fetchDocuments();
  }, []);

  const downloadDocument = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('center-documents').download(filePath);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <NavigationBackButton fallback="/school" label="بازگشت به دشبورد مکتب" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileDown className="h-6 w-6" />
          اسناد و رهنمودهای مرکز
        </h1>
        <p className="text-muted-foreground">دریافت رهنمودها، اسناد پالیسی، فارمت‌ها و منابع آموزشی</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">در حال دریافت اسناد و رهنمودها...</p>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">در حال حاضر سندی برای دانلود موجود نیست.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                <CardDescription>
                  {doc.category} • {format(new Date(doc.created_at), 'yyyy/MM/dd')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  aria-label="دانلود سند"
                  onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  دانلود سند
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
