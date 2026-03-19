import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessErrorProps {
  type: 'missing_role' | 'invalid_role' | 'unauthorized';
  onRetry?: () => void;
}

export default function AccessError({ type, onRetry }: AccessErrorProps) {
  const { t } = useTranslation();

  const getErrorContent = () => {
    switch (type) {
      case 'missing_role':
        return {
          title: t('common.error'),
          description: t('errors.roleNotAssigned'),
          action: 'contact_admin'
        };
      case 'invalid_role':
        return {
          title: t('common.error'),
          description: t('errors.invalidRole'),
          action: 'contact_admin'
        };
      case 'unauthorized':
        return {
          title: t('common.error'),
          description: t('errors.unauthorizedAccess'),
          action: 'go_home'
        };
      default:
        return {
          title: t('common.error'),
          description: t('common.error_occurred'),
          action: 'go_home'
        };
    }
  };

  const { title, description, action } = getErrorContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-destructive/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {type === 'missing_role' && t('errors.roleNotAssigned')}
              {type === 'invalid_role' && t('errors.invalidRole')}
              {type === 'unauthorized' && t('errors.unauthorizedAccess')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {description}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {action === 'contact_admin' && (
                <>
                  <Button
                    asChild
                    variant="default"
                    className="flex-1"
                  >
                    <Link to="/">{t('common.back')}</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onRetry}
                  >
                    {t('errors.tryAgain')}
                  </Button>
                </>
              )}
              {action === 'go_home' && (
                <Button
                  asChild
                  className="w-full"
                >
                  <Link to="/"><Home className="mr-2 h-4 w-4" />{t('navigation.home')}</Link>
                </Button>
              )}
            </div>

            {action === 'contact_admin' && (
              <p className="text-sm text-muted-foreground text-center">
                {t('errors.contactAdmin')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
