import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Loader2, CheckCircle } from 'lucide-react';

export default function SubmitStatistics() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    academic_year: new Date().getFullYear().toString(),
    total_students: '',
    male_students: '',
    female_students: '',
    total_teachers: '',
    attendance_rate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !user) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('statistics_submissions').insert({
      school_id: profile.school_id,
      submitted_by: user.id,
      academic_year: formData.academic_year,
      total_students: parseInt(formData.total_students) || 0,
      male_students: parseInt(formData.male_students) || 0,
      female_students: parseInt(formData.female_students) || 0,
      total_teachers: parseInt(formData.total_teachers) || 0,
      attendance_rate: parseFloat(formData.attendance_rate) || null,
      notes: formData.notes || null
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
      title: "Statistics Submitted",
      description: "Your data has been sent to the center."
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Statistics Submitted Successfully!</h2>
              <p className="text-muted-foreground">Your data has been sent to the center for review.</p>
              <Button onClick={() => { setSubmitted(false); setFormData({ academic_year: new Date().getFullYear().toString(), total_students: '', male_students: '', female_students: '', total_teachers: '', attendance_rate: '', notes: '' }); }}>
                Submit Another
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
          <BarChart3 className="h-6 w-6" />
          Submit Statistics
        </h1>
        <p className="text-muted-foreground">Enter your school's student and attendance data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Statistics Form</CardTitle>
          <CardDescription>All fields marked with * are required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_students">Total Students *</Label>
                <Input
                  id="total_students"
                  type="number"
                  value={formData.total_students}
                  onChange={(e) => setFormData({ ...formData, total_students: e.target.value })}
                  placeholder="0"
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="male_students">Male Students</Label>
                <Input
                  id="male_students"
                  type="number"
                  value={formData.male_students}
                  onChange={(e) => setFormData({ ...formData, male_students: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="female_students">Female Students</Label>
                <Input
                  id="female_students"
                  type="number"
                  value={formData.female_students}
                  onChange={(e) => setFormData({ ...formData, female_students: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_teachers">Total Teachers</Label>
                <Input
                  id="total_teachers"
                  type="number"
                  value={formData.total_teachers}
                  onChange={(e) => setFormData({ ...formData, total_teachers: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance_rate">Attendance Rate (%)</Label>
                <Input
                  id="attendance_rate"
                  type="number"
                  value={formData.attendance_rate}
                  onChange={(e) => setFormData({ ...formData, attendance_rate: e.target.value })}
                  placeholder="85.5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Statistics'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
