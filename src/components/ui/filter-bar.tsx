import { useState } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  userId?: number | null;
  onUserIdChange?: (value: number | null) => void;
  onApply: () => void;
  onClear: () => void;
  showUserFilter?: boolean;
  additionalFilters?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  userId,
  onUserIdChange,
  onApply,
  onClear,
  showUserFilter = false,
  additionalFilters,
  placeholder = 'Search...',
  className,
}: FilterBarProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchUsers = async () => {
    if (!user?.is_superuser || !showUserFilter) return;
    
    setLoadingUsers(true);
    try {
      const response = await api.get<{ data: Array<{ id: number; name: string; phone: string }> }>('/api/vendors/?page_size=1000');
      if (response.data) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserFilterOpen = () => {
    if (users.length === 0 && !loadingUsers) {
      fetchUsers();
    }
  };

  const hasAdvancedFilters = additionalFilters || (showUserFilter && user?.is_superuser);
  const hasActiveFilters = search || userId;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };

  return (
    <div className={cn('mb-3 md:mb-4', className)}>
      {/* Main Filter Row - Always Visible */}
      <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-card border rounded-lg shadow-sm transition-all duration-200">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 md:left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-7 md:pl-8 h-7 md:h-8 text-sm border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all duration-200"
          />
        </div>

        {/* Advanced Filters Toggle */}
        {hasAdvancedFilters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 md:h-8 px-1.5 md:px-2 gap-1 text-xs transition-all duration-200',
                    showAdvanced && 'bg-muted'
                  )}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showAdvanced ? 'Hide' : 'Show'} advanced filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 md:gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onApply} 
                  size="sm"
                  className="h-7 md:h-8 px-2 md:px-3 text-xs gap-1 md:gap-1.5 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Apply</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onClear} 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    'h-7 md:h-8 px-1.5 md:px-2 text-xs transition-all duration-200',
                    hasActiveFilters && 'text-destructive hover:text-destructive hover:bg-destructive/10'
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1">Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {hasAdvancedFilters && (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleContent className="transition-all duration-200">
            <div className="mt-2 p-3 bg-muted/30 border rounded-lg space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                {/* User/Vendor Filter */}
                {showUserFilter && user?.is_superuser && onUserIdChange && (
                  <div className="w-full sm:w-48">
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">
                      Vendor
                    </label>
                    <Select
                      value={userId ? String(userId) : 'all'}
                      onValueChange={(value) => onUserIdChange(value === 'all' ? null : parseInt(value))}
                      onOpenChange={handleUserFilterOpen}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All vendors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        {(users || []).map((u) => (
                          <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                            {u.name} ({u.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Additional Filters */}
                {additionalFilters}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Compact inline filter variant for simpler use cases
interface CompactFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CompactFilterBar({
  search,
  onSearchChange,
  onApply,
  onClear,
  placeholder = 'Search...',
  className,
  children,
}: CompactFilterBarProps) {
  const hasActiveFilters = search;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };

  return (
    <div className={cn('flex items-center gap-2 p-2 mb-4 bg-card border rounded-lg shadow-sm', className)}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8 h-8 text-sm border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50"
        />
      </div>
      
      {children}
      
      <Button 
        onClick={onApply} 
        size="sm"
        className="h-8 px-3 text-xs gap-1.5"
      >
        <Check className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Apply</span>
      </Button>
      
      <Button 
        onClick={onClear} 
        variant="ghost" 
        size="sm"
        className={cn(
          'h-8 px-2 text-xs',
          hasActiveFilters && 'text-destructive hover:text-destructive hover:bg-destructive/10'
        )}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
