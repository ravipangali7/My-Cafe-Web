import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ItemActionVariant =
  | 'view'
  | 'edit'
  | 'delete'
  | 'primary'
  | 'success'
  | 'default';

export interface ItemAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: ItemActionVariant;
}

interface ItemActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions: ItemAction[];
}

const variantButtonClass: Record<ItemActionVariant, string> = {
  view:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
  edit: 'bg-amber-500 text-white hover:bg-amber-600 border-0',
  delete: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border-0',
  success: 'bg-green-600 text-white hover:bg-green-700 border-0',
  default:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
};

export function ItemActionsModal({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: ItemActionsModalProps) {
  const handleAction = (action: ItemAction) => {
    onOpenChange(false);
    action.onClick();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                'w-full justify-start min-h-[44px] touch-target rounded-xl',
                variantButtonClass[action.variant ?? 'default']
              )}
              onClick={() => handleAction(action)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
