import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardDateFilter, DASHBOARD_DATE_FILTER_OPTIONS } from '@/lib/types';

interface DateFilterBarProps {
  value: DashboardDateFilter;
  onChange: (value: DashboardDateFilter) => void;
  className?: string;
  disabled?: boolean;
}

export function DateFilterBar({ value, onChange, className, disabled }: DateFilterBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-accent/50 rounded-lg overflow-x-auto',
        className
      )}
    >
      {DASHBOARD_DATE_FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-pressed={value === option.value}
          className={cn(
            'h-8 px-3 text-xs font-medium transition-all shrink-0 cursor-pointer',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
