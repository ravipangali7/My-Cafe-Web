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
  /** When true, use smaller switch and badge (e.g. for header on mobile) */
  compact?: boolean;
}

export function VendorOnlineToggle({
  isOnline,
  onToggle,
  disabled = false,
  className,
  compact = false,
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
      <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2', className)}>
        <Switch
          checked={isOnline}
          onCheckedChange={handleSwitchClick}
          disabled={disabled || loading}
          className={compact ? 'h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&[data-state=checked]>span]:translate-x-5' : undefined}
        />
        {loading ? (
          <Loader2 className={cn('animate-spin text-muted-foreground', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        ) : (
          <Badge
            variant="outline"
            className={cn(
              compact ? 'text-[10px] font-medium px-1.5 py-0.5' : 'text-xs font-medium',
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
