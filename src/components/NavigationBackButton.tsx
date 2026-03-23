import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface NavigationBackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

export default function NavigationBackButton({ 
  fallback = '/', 
  label = 'بازگشت',
  className 
}: NavigationBackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={className}
      aria-label={label}
    >
      <ArrowRight className="h-4 w-4 ml-1" />
      {label}
    </Button>
  );
}
