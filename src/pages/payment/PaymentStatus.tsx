import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Home, 
  RefreshCw,
  Copy,
  ArrowLeft,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  verifyPayment, 
  pollPaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusColor
} from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import type { VerifyPaymentResponse } from '@/lib/types';

export default function PaymentStatus() {
  const { txnId: txnIdFromParams } = useParams<{ txnId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Support client_txn_id from query params (UG sends both client_txn_id and txn_id)
  // Prioritize client_txn_id (our ID) over txn_id (UG's internal ID)
  const txnIdFromQuery = searchParams.get('client_txn_id') || searchParams.get('txn_id');
  const txnId = txnIdFromParams || txnIdFromQuery;
  
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentData, setPaymentData] = useState<VerifyPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if navigation should be blocked
  const isProcessing = loading || polling || verifying;
  const isPendingStatus = paymentData?.status === 'pending' || paymentData?.status === 'scanning';

  // Get initial status from URL params (from callback redirect)
  const initialStatus = searchParams.get('status');
  const urlError = searchParams.get('error');

  const fetchPaymentStatus = useCallback(async () => {
    if (!txnId) {
      setError('Transaction ID not found');
      setLoading(false);
      return;
    }

    try {
      setVerifying(true);
      const result = await verifyPayment(txnId);
      
      if (result.error) {
        setError(result.error);
        setVerifying(false);
      } else if (result.data) {
        setPaymentData(result.data);
        
        // If still pending, start polling
        // The backend now has retry logic, but we still poll as additional fallback
        if (result.data.status === 'pending' || result.data.status === 'scanning') {
          setPolling(true);
          const pollResult = await pollPaymentStatus(
            txnId,
            30,  // max attempts
            2000, // 2 second interval
            (status) => {
              // Update status during polling
              setPaymentData(prev => prev ? { ...prev, status: status as any } : null);
            }
          );
          
          if (pollResult.data) {
            setPaymentData(pollResult.data);
          }
          setPolling(false);
        }
        setVerifying(false);
      }
    } catch (err) {
      setError('Failed to fetch payment status');
      setVerifying(false);
    } finally {
      setLoading(false);
    }
  }, [txnId]);

  useEffect(() => {
    if (urlError) {
      setError(getErrorMessage(urlError));
      setLoading(false);
      return;
    }
    
    fetchPaymentStatus();
  }, [fetchPaymentStatus, urlError]);

  // After successful subscription payment, redirect to dashboard
  useEffect(() => {
    if (
      paymentData?.status === 'success' &&
      paymentData?.transaction?.payment_type === 'subscription_fee' &&
      user
    ) {
      const t = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [paymentData?.status, paymentData?.transaction?.payment_type, user, navigate]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'missing_txn_id':
        return 'Transaction ID is missing';
      case 'transaction_not_found':
        return 'Transaction not found';
      case 'server_error':
        return 'Server error occurred';
      default:
        return 'An error occurred';
    }
  };

  const handleCopyUTR = () => {
    if (paymentData?.transaction?.utr) {
      navigator.clipboard.writeText(paymentData.transaction.utr);
      toast.success('UTR copied to clipboard');
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchPaymentStatus();
  };

  const handleGoHome = () => {
    if (user) {
      // Logged-in user goes to dashboard
      navigate('/dashboard');
    } else {
      // Non-logged-in user goes to vendor's menu
      const vendorPhone = paymentData?.transaction?.vendor_phone;
      if (vendorPhone) {
        navigate(`/menu/${vendorPhone}`);
      } else {
        // Fallback to home if no vendor phone
        navigate('/');
      }
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderStatusIcon = () => {
    // Show spinner while loading, polling, or verifying
    if (isProcessing) {
      return (
        <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
          <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
        </div>
      );
    }

    const status = paymentData?.status;

    if (status === 'success') {
      return (
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      );
    }

    if (status === 'failure') {
      return (
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
      );
    }

    // Pending status - show clock icon
    return (
      <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
        <Clock className="h-12 w-12 text-yellow-600" />
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (loading) {
      return 'Checking payment status...';
    }

    if (polling) {
      return 'Verifying payment with gateway...';
    }

    if (verifying) {
      return 'Processing payment confirmation...';
    }

    if (error) {
      return error;
    }

    // Show pending message with hint to wait
    if (isPendingStatus) {
      return 'Payment processing - please wait...';
    }

    return getPaymentStatusLabel(paymentData?.status);
  };

  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={handleGoHome} className="w-full">
                {user ? (
                  <>
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </>
                ) : (
                  <>
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Go to Menu
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {renderStatusIcon()}
          <CardTitle className={`text-xl mt-4 ${getPaymentStatusColor(paymentData?.status)}`}>
            {renderStatusMessage()}
          </CardTitle>
          {paymentData?.transaction?.ug_remark && (
            <CardDescription>{paymentData.transaction.ug_remark}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          {paymentData?.transaction && (
            <div className="bg-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-semibold text-lg">
                  ₹{parseFloat(paymentData.transaction.amount).toFixed(2)}
                </span>
              </div>
              
              {paymentData.transaction.utr && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">UTR / Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{paymentData.transaction.utr}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={handleCopyUTR}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {paymentData.transaction.vpa && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">UPI ID</span>
                  <span className="font-mono text-sm">{paymentData.transaction.vpa}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transaction ID</span>
                <span className="font-mono text-xs">{txnId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date</span>
                <span className="text-sm">
                  {new Date(paymentData.transaction.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Show verifying indicator when processing */}
            {isProcessing && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-2">
                <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
                Please wait while we confirm your payment...
              </div>
            )}
            
            {(paymentData?.status === 'pending' || paymentData?.status === 'scanning') && (
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                className="w-full"
                disabled={isProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Verifying...' : 'Refresh Status'}
              </Button>
            )}
            
            {paymentData?.status === 'failure' && (
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {/* Navigation button - goes to dashboard for logged-in users, menu for guests */}
            <Button 
              onClick={handleGoHome} 
              className={`w-full ${paymentData?.status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              disabled={isProcessing || isPendingStatus}
            >
              {user ? (
                <>
                  <Home className="h-4 w-4 mr-2" />
                  {isProcessing || isPendingStatus ? 'Please wait...' : 'Go to Dashboard'}
                </>
              ) : (
                <>
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  {isProcessing || isPendingStatus ? 'Please wait...' : 'Go to Menu'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
