import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardPeriod } from '@/lib/types';

interface PeriodSelectorProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
  className?: string;
}

const periods: { value: DashboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-accent/50 rounded-lg', className)}>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-3 text-xs font-medium transition-all',
            value === period.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
          )}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
