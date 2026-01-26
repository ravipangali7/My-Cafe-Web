import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
}

const variantStyles = {
  default: 'bg-accent text-accent-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  secondary: 'bg-secondary/10 text-secondary',
};

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
      variantStyles[variant]
    )}>
      {status.replace(/_/g, ' ').replace(/-/g, ' ')}
    </span>
  );
}

export function getOrderStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'completed':
      return 'success';
    case 'accepted':
      return 'warning';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getPaymentStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
    case 'refunded':
      return 'destructive';
    default:
      return 'default';
  }
}

export function getActiveStatusVariant(isActive: boolean): StatusBadgeProps['variant'] {
  return isActive ? 'success' : 'destructive';
}
