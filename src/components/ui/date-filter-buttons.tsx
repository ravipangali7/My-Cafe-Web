import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

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

const filterButtons: { label: string; value: DateFilterType }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
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

  return (
    <div className={`space-y-3 ${className}`}>
      {showDateInputs && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="start-date" className="text-xs text-muted-foreground mb-1 block">
              Start Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="start-date"
                type="date"
                value={startDate || ''}
                onChange={(e) => handleDateInputChange('start', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date" className="text-xs text-muted-foreground mb-1 block">
              End Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="end-date"
                type="date"
                value={endDate || ''}
                onChange={(e) => handleDateInputChange('end', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            type="button"
            variant={activeFilter === btn.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
        <Button
          type="button"
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterClick('all')}
        >
          All Time
        </Button>
      </div>
    </div>
  );
}
