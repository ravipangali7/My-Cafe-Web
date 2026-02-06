import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { cn } from '@/lib/utils';

export interface SummaryStatsPeriodItem {
  label: string;
  amount: string | number;
  orders: number;
}

interface SummaryStatsCardProps {
  firstRow: SummaryStatsPeriodItem;
  secondRowLeft: SummaryStatsPeriodItem;
  secondRowRight: SummaryStatsPeriodItem;
  loading?: boolean;
  currencySymbol?: string;
  className?: string;
}

function PeriodBlock({
  item,
  currencySymbol = '₹',
  className,
}: {
  item: SummaryStatsPeriodItem;
  currencySymbol?: string;
  className?: string;
}) {
  const amountStr =
    typeof item.amount === 'string'
      ? formatCurrency(item.amount, currencySymbol)
      : formatCurrency(item.amount, currencySymbol);
  return (
    <div
      className={cn('flex flex-col space-y-1', className)}
      aria-label={`${item.label}: ${amountStr}, ${item.orders} orders`}
    >
      <span className="text-sm text-primary-foreground/95">{item.label}</span>
      <span className="text-xl md:text-2xl font-bold text-primary-foreground tracking-tight">
        {amountStr}
      </span>
      <span className="text-sm text-primary-foreground/90">
        {item.orders.toLocaleString()} orders
      </span>
    </div>
  );
}

export function SummaryStatsCard({
  firstRow,
  secondRowLeft,
  secondRowRight,
  loading = false,
  currencySymbol = '₹',
  className,
}: SummaryStatsCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'w-full rounded-xl border border-primary/20 bg-primary text-primary-foreground p-4 md:p-5 card-shadow-premium',
          className
        )}
        aria-busy="true"
        aria-label="Loading summary stats"
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
            <Skeleton className="h-7 w-24 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-16 bg-primary-foreground/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-primary-foreground/20">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
              <Skeleton className="h-7 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
            </div>
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
              <Skeleton className="h-7 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-primary/20 bg-primary text-primary-foreground p-4 md:p-5 card-shadow-premium',
        className
      )}
      role="region"
      aria-label="Summary statistics"
    >
      <div className="space-y-4">
        <PeriodBlock item={firstRow} currencySymbol={currencySymbol} />
        <div className="grid grid-cols-2 grid-rows-2 gap-3 md:gap-4 pt-3 border-t border-primary-foreground/20">
          <PeriodBlock
            item={secondRowLeft}
            currencySymbol={currencySymbol}
            className="min-w-0 pr-3 sm:border-r sm:border-primary-foreground/20 sm:pr-4"
          />
          <PeriodBlock
            item={secondRowRight}
            currencySymbol={currencySymbol}
            className="min-w-0"
          />
        </div>
      </div>
    </div>
  );
}
