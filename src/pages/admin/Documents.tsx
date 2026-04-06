import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Plus, Loader2, Trash2, Upload, Download } from 'lucide-react';
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

export default function AdminDocuments() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    const { data } = await supabase
      .from('center_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setDocuments(data);
    setLoading(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;
    if (!session?.access_token) {
      toast({ title: "خطا", description: "لطفاً دوباره وارد سیستم شوید", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    // Upload file
    const fileExt = selectedFile.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('center-documents')
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast({
        title: "آپلود ناموفق",
        description: uploadError.message,
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Create record
    const { error } = await supabase.from('center_documents').insert({
      title: newDocument.title,
      description: newDocument.description || null,
      file_path: filePath,
      file_name: selectedFile.name,
      category: newDocument.category,
      created_by: user.id
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "ناموفق", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "سند آپلود شد", description: "اکنون برای تمام مکاتب در دسترس است." });
    setIsAddDialogOpen(false);
    setNewDocument({ title: '', description: '', category: 'general' });
    setSelectedFile(null);
    fetchDocuments();
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from('center-documents').remove([filePath]);
    const { error } = await supabase.from('center_documents').delete().eq('id', id);
    
    if (error) {
      toast({ title: "حذف ناموفق", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "حذف شد" });
    fetchDocuments();
  };

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileUp className="h-6 w-6" />
            اسناد
          </h1>
          <p className="text-muted-foreground">اسناد را با تمام مکاتب به اشتراک بگذارید</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              آپلود سند
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>آپلود سند</DialogTitle>
              <DialogDescription>این برای تمام مکاتب در دسترس خواهد بود</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان *</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="عنوان سند"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">دسته‌بندی</Label>
                <Input
                  id="category"
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                  placeholder="مثلاً: سیاست، برنامه درسی، دستورالعمل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">توضیح</Label>
                <Textarea
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="توضیح کوتاه..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>پرونده *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <p className="text-sm">{selectedFile.name}</p>
                  ) : (
                    <div>
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm text-muted-foreground">برای انتخاب کلیک کنید</p>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال آپلود...
                  </>
                ) : (
                  'آپلود'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">هنوز سندی آپلود نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <CardDescription>
                      {doc.category} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.file_path)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {doc.description && <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>}
                <Button variant="outline" size="sm" onClick={() => downloadDocument(doc.file_path, doc.file_name)}>
                  <Download className="mr-2 h-4 w-4" />
                  دانلود
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
