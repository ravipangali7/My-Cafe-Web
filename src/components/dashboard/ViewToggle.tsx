import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  currentView: 'superAdmin' | 'vendor';
  onViewChange: (view: 'superAdmin' | 'vendor') => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <Button
        variant={currentView === 'superAdmin' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('superAdmin')}
        className={cn(
          'flex-1',
          currentView === 'superAdmin' && 'bg-primary text-primary-foreground'
        )}
      >
        <Users className="h-4 w-4 mr-2" />
        Super Admin View
      </Button>
      <Button
        variant={currentView === 'vendor' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('vendor')}
        className={cn(
          'flex-1',
          currentView === 'vendor' && 'bg-primary text-primary-foreground'
        )}
      >
        <LayoutDashboard className="h-4 w-4 mr-2" />
        Vendor View
      </Button>
    </div>
  );
}
