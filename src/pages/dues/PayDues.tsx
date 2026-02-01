import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DueStatus {
  due_balance: number;
  due_threshold: number;
  is_blocked: boolean;
}

export default function PayDues() {
  const { user } = useAuth();
  const [dueStatus, setDueStatus] = useState<DueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchDueStatus = async () => {
      try {
        const response = await api.get<DueStatus>('/api/dues/status/');
        if (response.data) {
          setDueStatus(response.data);
        }
      } catch (error) {
        console.error('Error fetching due status:', error);
        toast.error('Failed to fetch due status');
      } finally {
        setLoading(false);
      }
    };

    fetchDueStatus();
  }, []);

  const handlePayment = async () => {
    if (!dueStatus) {
      toast.error('Unable to process payment');
      return;
    }

    if (dueStatus.due_balance <= 0) {
      toast.error('No payment required');
      return;
    }

    setProcessing(true);
    try {
      const payload: Record<string, string | number> = {
        amount: dueStatus.due_balance,
      };

      const response = await api.post<{
        message: string;
        remaining_dues: number;
        transaction_id: number;
      }>('/api/dues/pay/', payload);

      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setPaymentSuccess(true);
        toast.success('Payment processed successfully');
        
        // Check if user is no longer blocked
        const newDueBalance = response.data.remaining_dues;
        if (newDueBalance <= dueStatus.due_threshold) {
          // User is unblocked, redirect to dashboard after a short delay
          // Using window.location.href to force a full page reload so ProtectedRoute re-checks due status
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          // Update due status
          setDueStatus({
            ...dueStatus,
            due_balance: newDueBalance,
            is_blocked: newDueBalance >= dueStatus.due_threshold,
          });
          setPaymentSuccess(false);
        }
      }
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!dueStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Failed to load due status</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Warning Banner */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Account Access Restricted</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your due balance has exceeded the allowed threshold. Please clear your dues to regain access to all features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Due Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Due Balance
            </CardTitle>
            <CardDescription>
              Your current outstanding dues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">Your Due Balance</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{dueStatus.due_balance.toLocaleString()}
              </p>
            </div>

            {/* Payment Button */}
            {paymentSuccess ? (
              <div className="flex flex-col items-center gap-4 text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Payment Successful!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={processing || dueStatus.due_balance <= 0}
              >
                {processing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{dueStatus.due_balance.toLocaleString()}
                  </>
                )}
              </Button>
            )}

            {user && (
              <p className="text-xs text-center text-muted-foreground">
                Paying as: {user.name} ({user.phone})
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
