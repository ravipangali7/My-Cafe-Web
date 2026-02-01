import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dueStatus, setDueStatus] = useState<DueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchDueStatus = async () => {
      try {
        const response = await api.get<DueStatus>('/api/dues/status/');
        if (response.data) {
          setDueStatus(response.data);
          // Pre-fill amount to pay the minimum required to unblock
          const minimumPayment = response.data.due_balance - response.data.due_threshold + 1;
          if (minimumPayment > 0) {
            setPaymentAmount(String(Math.min(minimumPayment, response.data.due_balance)));
          }
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
    if (!dueStatus || !paymentAmount) {
      toast.error('Please enter a payment amount');
      return;
    }

    const amount = parseInt(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (amount > dueStatus.due_balance) {
      toast.error('Amount cannot exceed due balance');
      return;
    }

    setProcessing(true);
    try {
      const payload: Record<string, string | number> = {
        amount: amount,
      };
      
      if (utr.trim()) {
        payload.utr = utr.trim();
      }

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
        if (newDueBalance < dueStatus.due_threshold) {
          // User is unblocked, redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // Update due status
          setDueStatus({
            ...dueStatus,
            due_balance: newDueBalance,
            is_blocked: newDueBalance >= dueStatus.due_threshold,
          });
          setPaymentAmount('');
          setUtr('');
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

  const minimumPaymentToUnblock = Math.max(0, dueStatus.due_balance - dueStatus.due_threshold + 1);

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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Your Due Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{dueStatus.due_balance.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Threshold Limit</p>
                <p className="text-2xl font-bold">
                  ₹{dueStatus.due_threshold.toLocaleString()}
                </p>
              </div>
            </div>
            
            {minimumPaymentToUnblock > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Pay at least <span className="font-bold">₹{minimumPaymentToUnblock.toLocaleString()}</span> to regain full access
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {paymentSuccess ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
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
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay Now
              </CardTitle>
              <CardDescription>
                Clear your dues to continue using the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={dueStatus.due_balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum payable: ₹{dueStatus.due_balance.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utr">UTR / Reference Number (Optional)</Label>
                <Input
                  id="utr"
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter payment reference"
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={processing || !paymentAmount}
              >
                {processing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{paymentAmount ? parseInt(paymentAmount).toLocaleString() : '0'}
                  </>
                )}
              </Button>

              {user && (
                <p className="text-xs text-center text-muted-foreground">
                  Paying as: {user.name} ({user.phone})
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
