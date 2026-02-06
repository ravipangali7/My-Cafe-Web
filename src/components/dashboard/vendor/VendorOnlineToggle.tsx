import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Loader2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorOnlineToggleProps {
  isOnline: boolean;
  onToggle: (next: boolean) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function VendorOnlineToggle({
  isOnline,
  onToggle,
  disabled = false,
  className,
}: VendorOnlineToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const handleSwitchClick = () => {
    const next = !isOnline;
    setPendingValue(next);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onToggle(pendingValue);
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const isGoingOffline = !pendingValue; // pendingValue false = going offline
  const title = isGoingOffline
    ? 'Go offline?'
    : 'Go online?';
  const description = isGoingOffline
    ? 'Are you sure you want to go offline? Customers will not be able to place orders.'
    : 'Are you sure you want to go online and start accepting orders?';

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <Switch
          checked={isOnline}
          onCheckedChange={handleSwitchClick}
          disabled={disabled || loading}
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium',
              isOnline
                ? 'border-green-600/50 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-muted-foreground/40 bg-muted/50 text-muted-foreground'
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        )}
      </div>
      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={title}
        description={description}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={isGoingOffline ? 'warning' : 'success'}
        onConfirm={handleConfirm}
        loading={loading}
        icon={<Store className="h-6 w-6" />}
      />
    </>
  );
}
