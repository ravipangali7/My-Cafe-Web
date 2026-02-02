import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom' | 'all';

interface DateFilterButtonsProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType, startDate?: string, endDate?: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  showDateInputs?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Get date range for a given filter type
 */
export function getDateRange(filter: DateFilterType): { startDate?: string; endDate?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  switch (filter) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
    }
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: formatDate(weekAgo), endDate: formatDate(today) };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { startDate: formatDate(monthAgo), endDate: formatDate(today) };
    }
    case 'year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(startOfYear), endDate: formatDate(today) };
    }
    case 'all':
    default:
      return {};
  }
}

const filterButtons: { label: string; shortLabel: string; value: DateFilterType }[] = [
  { label: 'Today', shortLabel: '1D', value: 'today' },
  { label: 'Yesterday', shortLabel: 'Y', value: 'yesterday' },
  { label: 'Week', shortLabel: '1W', value: 'week' },
  { label: 'Month', shortLabel: '1M', value: 'month' },
  { label: 'Year', shortLabel: '1Y', value: 'year' },
];

export function DateFilterButtons({
  activeFilter,
  onFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showDateInputs = true,
  className = '',
  compact = false,
}: DateFilterButtonsProps) {
  const handleFilterClick = (filter: DateFilterType) => {
    const range = getDateRange(filter);
    onFilterChange(filter, range.startDate, range.endDate);
  };

  const handleDateInputChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      onStartDateChange?.(value);
      if (value && endDate) {
        onFilterChange('custom', value, endDate);
      }
    } else {
      onEndDateChange?.(value);
      if (startDate && value) {
        onFilterChange('custom', startDate, value);
      }
    }
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {/* Compact Date Inputs */}
        {showDateInputs && (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="date"
                value={startDate || ''}
                onChange={(e) => handleDateInputChange('start', e.target.value)}
                className="pl-7 h-8 w-32 text-xs border-muted"
              />
            </div>
            <span className="text-muted-foreground text-xs">to</span>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="date"
                value={endDate || ''}
                onChange={(e) => handleDateInputChange('end', e.target.value)}
                className="pl-7 h-8 w-32 text-xs border-muted"
              />
            </div>
          </div>
        )}

        {/* Compact Quick Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              type="button"
              variant={activeFilter === btn.value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-7 px-2 text-[10px] font-medium transition-all duration-200',
                activeFilter === btn.value && 'shadow-sm'
              )}
              onClick={() => handleFilterClick(btn.value)}
            >
              <span className="hidden sm:inline">{btn.label}</span>
              <span className="sm:hidden">{btn.shortLabel}</span>
            </Button>
          ))}
          <Button
            type="button"
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 px-2 text-[10px] font-medium transition-all duration-200',
              activeFilter === 'all' && 'shadow-sm'
            )}
            onClick={() => handleFilterClick('all')}
          >
            All
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showDateInputs && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block font-medium">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={startDate || ''}
                onChange={(e) => handleDateInputChange('start', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block font-medium">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={endDate || ''}
                onChange={(e) => handleDateInputChange('end', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1.5">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            type="button"
            variant={activeFilter === btn.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs font-medium transition-all duration-200',
              activeFilter === btn.value && 'shadow-sm'
            )}
            onClick={() => handleFilterClick(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
        <Button
          type="button"
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 px-2.5 text-xs font-medium transition-all duration-200',
            activeFilter === 'all' && 'shadow-sm'
          )}
          onClick={() => handleFilterClick('all')}
        >
          All Time
        </Button>
      </div>
    </div>
  );
}
