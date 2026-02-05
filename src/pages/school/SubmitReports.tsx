import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, CheckCircle, Upload } from 'lucide-react';

export default function SubmitReports() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !user || !selectedFile) return;

    setIsSubmitting(true);

    // Upload file to storage
    const fileExt = selectedFile.name.split('.').pop();
    const filePath = `${profile.school_id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('school-reports')
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast({
        title: "Upload Failed",
        description: uploadError.message,
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Create database record
    const { error } = await supabase.from('report_submissions').insert({
      school_id: profile.school_id,
      submitted_by: user.id,
      title: formData.title,
      description: formData.description || null,
      file_path: filePath,
      file_name: selectedFile.name
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: "Report Submitted",
      description: "Your report has been uploaded successfully."
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Report Uploaded Successfully!</h2>
              <p className="text-muted-foreground">Your report has been sent to the center.</p>
              <Button onClick={() => { setSubmitted(false); setFormData({ title: '', description: '' }); setSelectedFile(null); }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Submit Reports
        </h1>
        <p className="text-muted-foreground">Upload documents and reports to the center</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Report</CardTitle>
          <CardDescription>Supported formats: PDF, DOC, DOCX, XLS, XLSX</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Monthly Attendance Report - January 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the report..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>File *</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div>
                    <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Click to select a file</p>
                    <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
