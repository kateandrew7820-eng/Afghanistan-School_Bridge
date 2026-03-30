import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  category: string;
  created_at: string;
}

export default function Schoolاسناد() {
  const [اسناد, setاسناد] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchاسناد() {
      const { data } = await supabase
        .from('center_اسناد')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setاسناد(data);
      setLoading(false);
    }

    fetchاسناد();
  }, []);

  const downloadDocument = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('center-اسناد').download(filePath);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileDown className="h-6 w-6" />
          Center اسناد
        </h1>
        <p className="text-muted-foreground">Download guidelines, policies, and resources</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading اسناد...</p>
      ) : اسناد.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No اسناد available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {اسناد.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                <CardDescription>
                  {doc.category} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {doc.file_name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
