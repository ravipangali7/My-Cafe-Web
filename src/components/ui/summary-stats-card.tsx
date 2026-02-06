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

function PeriodRow({
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
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base',
        className
      )}
      aria-label={`${item.label}: ${amountStr}, ${item.orders} orders`}
    >
      <span className="font-medium text-primary-foreground/95">{item.label}</span>
      <span className="text-primary-foreground/70" aria-hidden>
        |
      </span>
      <span className="font-semibold text-primary-foreground">{amountStr}</span>
      <span className="text-primary-foreground/70" aria-hidden>
        |
      </span>
      <span className="text-primary-foreground/95">
        {item.orders.toLocaleString()} Orders
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
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-12 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-20 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-16 bg-primary-foreground/20" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-20 bg-primary-foreground/20" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-14 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-20 bg-primary-foreground/20" />
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
      <div className="space-y-3 md:space-y-4">
        <PeriodRow item={firstRow} currencySymbol={currencySymbol} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <PeriodRow
            item={secondRowLeft}
            currencySymbol={currencySymbol}
            className="min-w-0"
          />
          <PeriodRow
            item={secondRowRight}
            currencySymbol={currencySymbol}
            className="min-w-0"
          />
        </div>
      </div>
    </div>
  );
}
