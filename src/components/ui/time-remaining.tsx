import { differenceInDays, differenceInMonths, isPast, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TimeRemainingProps {
  expiryDate: string | null | undefined;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

interface TimeRemainingResult {
  text: string;
  variant: 'success' | 'warning' | 'destructive' | 'muted';
  isExpired: boolean;
  totalDays: number;
}

export function calculateTimeRemaining(expiryDate: string | null | undefined): TimeRemainingResult {
  if (!expiryDate) {
    return {
      text: 'No expiry set',
      variant: 'muted',
      isExpired: false,
      totalDays: Infinity,
    };
  }

  const expiry = parseISO(expiryDate);
  
  if (!isValid(expiry)) {
    return {
      text: 'Invalid date',
      variant: 'muted',
      isExpired: false,
      totalDays: 0,
    };
  }

  const now = new Date();
  
  if (isPast(expiry)) {
    const daysAgo = Math.abs(differenceInDays(expiry, now));
    return {
      text: `Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`,
      variant: 'destructive',
      isExpired: true,
      totalDays: -daysAgo,
    };
  }

  const totalDays = differenceInDays(expiry, now);
  const months = differenceInMonths(expiry, now);
  const remainingDays = totalDays - (months * 30);

  let text: string;
  let variant: 'success' | 'warning' | 'destructive';

  if (months > 0) {
    if (remainingDays > 0) {
      text = `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''} left`;
    } else {
      text = `${months} month${months !== 1 ? 's' : ''} left`;
    }
  } else {
    text = `${totalDays} day${totalDays !== 1 ? 's' : ''} left`;
  }

  // Determine variant based on remaining time
  if (totalDays > 30) {
    variant = 'success';
  } else if (totalDays > 7) {
    variant = 'warning';
  } else {
    variant = 'destructive';
  }

  return { text, variant, isExpired: false, totalDays };
}

const variantStyles = {
  success: {
    text: 'text-success',
    bg: 'bg-success/10',
    icon: CheckCircle,
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    icon: Clock,
  },
  destructive: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    icon: AlertTriangle,
  },
  muted: {
    text: 'text-muted-foreground',
    bg: 'bg-muted/10',
    icon: Clock,
  },
};

export function TimeRemaining({
  expiryDate,
  className,
  showIcon = true,
  compact = false,
}: TimeRemainingProps) {
  const { text, variant } = calculateTimeRemaining(expiryDate);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  if (compact) {
    return (
      <span className={cn('text-sm font-medium', styles.text, className)}>
        {text}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{text}</span>
    </div>
  );
}

// Badge style time remaining
export function TimeRemainingBadge({
  expiryDate,
  className,
}: {
  expiryDate: string | null | undefined;
  className?: string;
}) {
  const { text, variant } = calculateTimeRemaining(expiryDate);
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {text}
    </span>
  );
}

// Simple text display
export function TimeRemainingText({
  expiryDate,
  className,
}: {
  expiryDate: string | null | undefined;
  className?: string;
}) {
  const { text, variant } = calculateTimeRemaining(expiryDate);
  const styles = variantStyles[variant];

  return (
    <span className={cn('text-sm', styles.text, className)}>
      {text}
    </span>
  );
}
