import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Loader2, CheckCircle } from 'lucide-react';

const formTypes = [
  { value: 'infrastructure', label: 'Infrastructure Survey' },
  { value: 'teacher_evaluation', label: 'Teacher Evaluation' },
  { value: 'student_assessment', label: 'Student Assessment' },
  { value: 'resource_request', label: 'Resource Request' },
  { value: 'incident_report', label: 'Incident Report' },
  { value: 'other', label: 'Other' }
];

export default function SubmitForms() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    additional_info: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !user || !formType) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('form_submissions').insert({
      school_id: profile.school_id,
      submitted_by: user.id,
      form_type: formType,
      form_data: {
        title: formData.title,
        details: formData.details,
        additional_info: formData.additional_info
      }
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
      title: "Form Submitted",
      description: "Your form has been sent to the center."
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Form Submitted Successfully!</h2>
              <p className="text-muted-foreground">Your form has been sent to the center for review.</p>
              <Button onClick={() => { setSubmitted(false); setFormType(''); setFormData({ title: '', details: '', additional_info: '' }); }}>
                Submit Another Form
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
          <ClipboardList className="h-6 w-6" />
          Submit Forms
        </h1>
        <p className="text-muted-foreground">Fill out and submit various forms to the center</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Submission</CardTitle>
          <CardDescription>Select a form type and fill in the details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Form Type *</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  {formTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Subject / Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief subject of your submission"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Details *</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Provide detailed information..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_info">Additional Information</Label>
              <Textarea
                id="additional_info"
                value={formData.additional_info}
                onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                placeholder="Any other relevant information..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !formType}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
