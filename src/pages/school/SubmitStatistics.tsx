import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SubmitStatistics() {
      const { user, profile, isDemoMode } = useAuth();

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

      const [error, setError] = useState('');

      const handleChange = (e: any) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
            setError('');
      };

      const validate = () => {
            const total = +formData.total_students || 0;
            const male = +formData.male_students || 0;
            const female = +formData.female_students || 0;

            if (!formData.academic_year || !total) return 'فیلدهای ضروری را پر کنید';
            if (male + female > total) return 'پسر + دختر بیشتر از کل است';
            if (+formData.attendance_rate > 100) return 'نرخ حضور > 100%';

            return '';
      };

      const handleSubmit = async (e: any) => {
            e.preventDefault();

            const err = validate();
            if (err) return setError(err);

            if (!user || !profile?.school_id) {
                  return setError('مشکل در اطلاعات کاربر');
            }

            setIsSubmitting(true);

            try {
                  if (!isDemoMode) {
                        const { error } = await supabase.from('statistics_submissions').insert({
                              school_id: profile.school_id,
                              submitted_by: user.id,
                              academic_year: formData.academic_year,
                              total_students: +formData.total_students || 0,
                              male_students: +formData.male_students || 0,
                              female_students: +formData.female_students || 0,
                              total_teachers: +formData.total_teachers || 0,
                              attendance_rate: formData.attendance_rate ? +formData.attendance_rate : null,
                              notes: formData.notes || null
                        });

                        if (error) throw error;
                  }

                  setSubmitted(true);
            } catch (e) {
                  console.error(e);
                  setError('خطا در ارسال. دوباره تلاش کنید');
            } finally {
                  setIsSubmitting(false);
            }
      };

      if (submitted) {
            return (
                  <div className="max-w-xl mx-auto">
                        <Card className="text-center p-6">
                              <CheckCircle className="mx-auto text-green-500 h-10 w-10 mb-3" />
                              <h2 className="font-bold">ارسال موفق ✅</h2>
                              <p className="text-sm text-muted-foreground">اطلاعات ثبت شد</p>
                              <Button className="mt-4" onClick={() => setSubmitted(false)}>ارسال جدید</Button>
                        </Card>
                  </div>
            );
      }

      return (
            <div className="max-w-2xl mx-auto space-y-6">

                  {/* Header */}
                  <div className="flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" />
                        <div>
                              <h1 className="text-xl font-bold">ارسال آمار</h1>
                              <p className="text-xs text-muted-foreground">School statistics submission</p>
                        </div>
                  </div>

                  {/* Demo Alert */}
                  {isDemoMode && (
                        <Alert className="bg-blue-50 border-blue-200">
                              <AlertCircle className="text-blue-500" />
                              <AlertDescription>Demo mode — data not saved</AlertDescription>
                        </Alert>
                  )}

                  {/* Error */}
                  {error && (
                        <Alert className="bg-red-50 border-red-200">
                              <AlertCircle className="text-red-500" />
                              <AlertDescription>{error}</AlertDescription>
                        </Alert>
                  )}

                  {/* Form */}
                  <Card className="shadow-sm border rounded-2xl">
                        <CardHeader>
                              <CardTitle>فورم آمار</CardTitle>
                              <CardDescription>Simple, fast, accurate</CardDescription>
                        </CardHeader>

                        <CardContent>
                              <form onSubmit={handleSubmit} className="space-y-5">

                                    <div className="grid md:grid-cols-2 gap-4">
                                          <Input name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="سال" />
                                          <Input name="total_students" type="number" value={formData.total_students} onChange={handleChange} placeholder="کل شاگردان" />
                                          <Input name="male_students" type="number" value={formData.male_students} onChange={handleChange} placeholder="پسر" />
                                          <Input name="female_students" type="number" value={formData.female_students} onChange={handleChange} placeholder="دختر" />
                                          <Input name="total_teachers" type="number" value={formData.total_teachers} onChange={handleChange} placeholder="معلمان" />
                                          <Input name="attendance_rate" type="number" value={formData.attendance_rate} onChange={handleChange} placeholder="حضور %" />
                                    </div>

                                    <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="یادداشت..." />

                                    <Button
                                          type="submit"
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all"
                                          disabled={isSubmitting}
                                    >
                                          {isSubmitting ? <Loader2 className="animate-spin" /> : 'ارسال'}
                                    </Button>

                              </form>
                        </CardContent>
                  </Card>
            </div>
      );
}