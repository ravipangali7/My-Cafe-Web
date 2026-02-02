import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  onConfirm: (remarks?: string) => Promise<void>;
  showRemarks?: boolean;
  remarksLabel?: string;
  remarksPlaceholder?: string;
  remarksRequired?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: <AlertTriangle className="h-6 w-6 text-foreground" />,
    buttonClass: '',
  },
  destructive: {
    icon: <XCircle className="h-6 w-6 text-destructive" />,
    buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6 text-success" />,
    buttonClass: 'bg-success text-success-foreground hover:bg-success/90',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-warning" />,
    buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90',
  },
};

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  showRemarks = false,
  remarksLabel = 'Remarks',
  remarksPlaceholder = 'Enter your remarks (optional)',
  remarksRequired = false,
  loading: externalLoading,
  icon,
}: ConfirmationModalProps) {
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = variantConfig[variant];
  const isProcessing = externalLoading !== undefined ? externalLoading : isLoading;

  const handleConfirm = async () => {
    if (showRemarks && remarksRequired && !remarks.trim()) {
      setError('Remarks are required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await onConfirm(showRemarks ? remarks : undefined);
      setRemarks('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      setRemarks('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-accent">
              {icon || config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {showRemarks && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              {remarksLabel}
              {remarksRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError(null);
              }}
              placeholder={remarksPlaceholder}
              className="min-h-[80px] resize-none"
              disabled={isProcessing}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn('flex-1 sm:flex-none', config.buttonClass)}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Convenience hooks for common confirmation patterns
export function useConfirmation() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: ConfirmationModalProps['variant'];
    onConfirm: (remarks?: string) => Promise<void>;
    showRemarks: boolean;
    remarksRequired: boolean;
    confirmLabel: string;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    onConfirm: async () => {},
    showRemarks: false,
    remarksRequired: false,
    confirmLabel: 'Confirm',
  });

  const confirm = (options: {
    title: string;
    description: string;
    variant?: ConfirmationModalProps['variant'];
    onConfirm: (remarks?: string) => Promise<void>;
    showRemarks?: boolean;
    remarksRequired?: boolean;
    confirmLabel?: string;
  }) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      onConfirm: options.onConfirm,
      showRemarks: options.showRemarks || false,
      remarksRequired: options.remarksRequired || false,
      confirmLabel: options.confirmLabel || 'Confirm',
    });
  };

  const close = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  return {
    state,
    confirm,
    close,
    ConfirmationModal: (
      <ConfirmationModal
        open={state.open}
        onOpenChange={(open) => !open && close()}
        title={state.title}
        description={state.description}
        variant={state.variant}
        onConfirm={state.onConfirm}
        showRemarks={state.showRemarks}
        remarksRequired={state.remarksRequired}
        confirmLabel={state.confirmLabel}
      />
    ),
  };
}
