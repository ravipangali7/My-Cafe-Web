import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Call Flutter WebView channel to close the app when user confirms exit. */
function requestExitApp(): void {
  const w = typeof window !== 'undefined' ? (window as Window & { ExitApp?: { postMessage?: (msg: string) => void } }) : null;
  if (w?.ExitApp?.postMessage) {
    w.ExitApp.postMessage('');
  }
}

export default function ExitConfirmScreen() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleCancel = () => {
    setOpen(false);
    navigate('/dashboard', { replace: true });
  };

  const handleExit = () => {
    setOpen(false);
    requestExitApp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AlertDialog open={open} onOpenChange={(o) => !o && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit app?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to exit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
