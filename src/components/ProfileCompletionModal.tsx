import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const QUESTIONS = [
  {
    id: 'question1',
    key: 'profileCompletion.question1.question',
    answersKey: 'profileCompletion.question1.answers',
  },
  {
    id: 'question2',
    key: 'profileCompletion.question2.question',
    answersKey: 'profileCompletion.question2.answers',
  },
  {
    id: 'question3',
    key: 'profileCompletion.question3.question',
    answersKey: 'profileCompletion.question3.answers',
  },
  {
    id: 'question4',
    key: 'profileCompletion.question4.question',
    answersKey: 'profileCompletion.question4.answers',
  },
];

export function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { saveAnswers, skipForNow } = useProfileCompletion();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const handleAnswerSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    // Validate answer selected
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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await saveAnswers(answers);
      
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setShowSuccess(true);
      
      // Show success message for 3 seconds before closing
      setTimeout(() => {
        onClose?.();
        setShowSuccess(false);
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

  if (showSuccess) {
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
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                سؤال {currentQuestionIndex + 1} از {QUESTIONS.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t(currentQuestion.key)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(t(currentQuestion.answersKey) as string[]).map((answer, index) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
