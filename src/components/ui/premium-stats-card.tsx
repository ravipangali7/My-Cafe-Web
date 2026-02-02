import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumStatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'highlight' | 'info';
  prefix?: string;
  suffix?: string;
  onClick?: () => void;
}

interface PremiumStatsCardsProps {
  stats: PremiumStatCard[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-accent text-foreground',
    value: 'text-foreground',
  },
  success: {
    card: 'bg-success/5 border-success/20',
    icon: 'bg-success/10 text-success',
    value: 'text-success',
  },
  warning: {
    card: 'bg-warning/5 border-warning/20',
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
  },
  destructive: {
    card: 'bg-destructive/5 border-destructive/20',
    icon: 'bg-destructive/10 text-destructive',
    value: 'text-destructive',
  },
  highlight: {
    card: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  info: {
    card: 'bg-blue-500/5 border-blue-500/20',
    icon: 'bg-blue-500/10 text-blue-500',
    value: 'text-blue-500',
  },
};

export function PremiumStatsCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  prefix,
  suffix,
  onClick,
}: PremiumStatCard) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 border',
        styles.card,
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              {prefix && (
                <span className={cn('text-lg font-semibold', styles.value)}>
                  {prefix}
                </span>
              )}
              <span className={cn('text-2xl font-bold tracking-tight', styles.value)}>
                {value}
              </span>
              {suffix && (
                <span className="text-sm font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
            {trend && (
              <div className="mt-1 flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex-shrink-0 p-2.5 rounded-xl',
              styles.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumStatsCards({
  stats,
  loading = false,
  columns = 4,
  className,
}: PremiumStatsCardsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={cn('grid gap-3 mb-6', gridCols[columns], className)}>
        {Array.from({ length: stats.length || 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="mt-2 h-7 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3 mb-6', gridCols[columns], className)}>
      {stats.map((stat) => (
        <PremiumStatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

// Scrollable stats container for many cards
export function ScrollableStatsCards({
  stats,
  loading = false,
  className,
}: Omit<PremiumStatsCardsProps, 'columns'>) {
  if (loading) {
    return (
      <div className={cn('flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex-shrink-0 w-40 overflow-hidden">
            <CardContent className="p-4">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="mt-2 h-7 w-12 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex-shrink-0 w-40">
          <PremiumStatsCard {...stat} />
        </div>
      ))}
    </div>
  );
}

// Format currency helper
export function formatCurrency(amount: number | string, currency = '₹'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency}0`;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Format number with suffix helper
export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
