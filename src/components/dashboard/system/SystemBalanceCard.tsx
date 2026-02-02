import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { cn } from '@/lib/utils';

interface SystemBalanceCardProps {
  balance: number;
  loading?: boolean;
  className?: string;
}

export function SystemBalanceCard({
  balance,
  loading = false,
  className,
}: SystemBalanceCardProps) {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-16 w-16 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden relative',
        'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5',
        'border-primary/20',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
              System Balance
            </p>
            <p className="text-4xl font-bold text-primary tracking-tight">
              {formatCurrency(balance)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>Active</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Total system funds
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/20">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
