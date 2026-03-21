import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

// Question definitions with hardcoded answers
const QUESTIONS = [
  {
    id: 'experience',
    question: 'چند سال در حوزه آموزش فعالیت دارید؟',
    answers: ['کمتر از 1 سال', '1-3 سال', '3-5 سال', 'بیش از 5 سال'],
  },
  {
    id: 'mainRole',
    question: 'نقش اصلی شما در مکتب کدام است؟',
    answers: ['معلم', 'مدیر', 'کارمند اداری', 'سایر'],
  },
  {
    id: 'languages',
    question: 'چه زبان‌هایی صحبت می‌کنید؟',
    answers: ['فارسی (دری)', 'پشتو', 'ترکمنی', 'دیگری'],
  },
];

export function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { saveAnswers, skipForNow } = useProfileCompletion();
  const { profile } = useAuth();

  const [currentStep, setCurrentStep] = useState<'identity' | 'questions' | 'success'>('identity');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Identity fields
  const [identity, setIdentity] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    school: profile?.school_name || '',
    district: profile?.district || '',
    province: profile?.province || '',
  });

  // Question answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
  const questionProgress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  // Handle identity field changes
  const handleIdentityChange = (field: keyof typeof identity, value: string) => {
    setIdentity(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate identity fields
  const validateIdentity = (): boolean => {
    if (!identity.fullName.trim()) {
      toast({
        title: t('common.warning'),
        description: 'لطفاً نام کامل خود را وارد کنید',
        variant: 'destructive',
      });
      return false;
    }
    if (!identity.school.trim()) {
      toast({
        title: t('common.warning'),
        description: 'لطفاً نام مکتب خود را وارد کنید',
        variant: 'destructive',
      });
      return false;
    }
    if (!identity.province.trim()) {
      toast({
        title: t('common.warning'),
        description: 'لطفاً ولایت خود را وارد کنید',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Handle moving to questions step
  const handleStartQuestions = () => {
    if (validateIdentity()) {
      setCurrentStep('questions');
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  // Handle next question
  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast({
        title: t('common.warning'),
        description: 'لطفاً یک جواب انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Combine identity and answers
      const completionData = {
        ...identity,
        ...answers,
      };

      const { error } = await saveAnswers(completionData);
      
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setCurrentStep('success');
      
      // Show success message for 3 seconds before closing
      setTimeout(() => {
        onClose?.();
        // Reset state
        setCurrentStep('identity');
        setCurrentQuestionIndex(0);
        setAnswers({});
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطایی رخ داد';
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    setIsLoading(true);
    try {
      const { error } = await skipForNow();
      
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      onClose?.();
      navigate('/afghanistan-info');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطایی رخ داد';
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (currentStep === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-600/20">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('profileCompletion.profileSaved')}</h2>
              <p className="text-muted-foreground">{t('profileCompletion.awaitingApproval')}</p>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                {t('profileCompletion.cannotAccess')}
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('profileCompletion.title')}</DialogTitle>
          <DialogDescription>{t('profileCompletion.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Identity Information Step */}
          {currentStep === 'identity' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات شخصی شما</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">نام کامل *</Label>
                    <Input
                      id="fullName"
                      placeholder="نام و تخلص"
                      value={identity.fullName}
                      onChange={(e) => handleIdentityChange('fullName', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل (اختیاری)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ایمیل خود را وارد کنید"
                      value={identity.email}
                      onChange={(e) => handleIdentityChange('email', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school">نام مکتب *</Label>
                    <Input
                      id="school"
                      placeholder="نام مکتب یا مؤسسه تحصیلی"
                      value={identity.school}
                      onChange={(e) => handleIdentityChange('school', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">ولسوالی (اختیاری)</Label>
                    <Input
                      id="district"
                      placeholder="نام ولسوالی"
                      value={identity.district}
                      onChange={(e) => handleIdentityChange('district', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">ولایت *</Label>
                    <Input
                      id="province"
                      placeholder="نام ولایت"
                      value={identity.province}
                      onChange={(e) => handleIdentityChange('province', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {t('profileCompletion.skipForNow')}
                </Button>
                
                <Button
                  onClick={handleStartQuestions}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ادامه
                </Button>
              </div>
            </>
          )}

          {/* Questions Step */}
          {currentStep === 'questions' && (
            <>
              {/* Progress indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>سؤال {currentQuestionIndex + 1} از {QUESTIONS.length}</span>
                  <span>{Math.round(questionProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${questionProgress}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-muted-foreground/20">
                        <input
                          type="radio"
                          id={`answer-${index}`}
                          name={currentQuestion.id}
                          value={answer}
                          checked={answers[currentQuestion.id] === answer}
                          onChange={() => handleAnswerSelect(answer)}
                          className="cursor-pointer w-4 h-4"
                        />
                        <Label 
                          htmlFor={`answer-${index}`} 
                          className="cursor-pointer flex-1 font-normal"
                        >
                          {answer}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {t('profileCompletion.skipForNow')}
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={isLoading || !answers[currentQuestion.id]}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLastQuestion ? t('profileCompletion.submit') : t('profileCompletion.next')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
