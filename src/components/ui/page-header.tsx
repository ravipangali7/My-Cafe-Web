import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: ReactNode;
  description?: string;
  backLink?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, backLink, action }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else if (backLink) {
      navigate(backLink);
    }
  };

  return (
    <div className="mb-4 md:mb-6">
      {backLink && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground hover:text-foreground touch-target min-h-[44px] md:min-h-0"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
