import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  price_per_month: number;
}

interface SubscriptionStatus {
  subscription_state: string;
  is_active: boolean;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  message: string | null;
  user: any;
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<SubscriptionStatus>('/api/subscription/status/');
      if (response.error) {
        toast.error('Failed to fetch subscription status');
        setLoading(false);
        return;
      }

      if (response.data) {
        setSubscriptionStatus(response.data);
        
        // If subscription is active or inactive_with_date, redirect
        if (response.data.subscription_state === 'active') {
          navigate('/dashboard');
          return;
        }
        if (response.data.subscription_state === 'inactive_with_date') {
          // Show message but don't redirect - user needs to contact admin
        }
      }
    } catch (error) {
      toast.error('Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await api.get<{ plans: SubscriptionPlan[]; subscription_fee_per_month: number }>('/api/subscription/plans/');
      if (response.error) {
        toast.error('Failed to fetch subscription plans');
        return;
      }

      if (response.data) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      toast.error('Failed to fetch subscription plans');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
      fetchPlans();
    }
  }, [user, fetchSubscriptionStatus, fetchPlans]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    setSelectedPlan(plan);
    setSubscribing(true);

    try {
      // In a real application, you would integrate with a payment gateway here
      // For now, we'll simulate a payment success
      const paymentTransactionId = `TXN${Date.now()}`;
      
      const response = await api.post('/api/subscription/subscribe/', {
        plan_id: plan.id,
        duration_months: plan.duration_months,
        payment_amount: plan.price,
        payment_transaction_id: paymentTransactionId,
      });

      if (response.error) {
        toast.error(response.error || 'Failed to activate subscription');
      } else {
        toast.success('Subscription activated successfully!');
        await fetchSubscriptionStatus();
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate subscription');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const getStatusMessage = () => {
    if (!subscriptionStatus) return null;

    switch (subscriptionStatus.subscription_state) {
      case 'inactive_with_date':
        return (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Contact Administrator</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription is inactive. Please contact the administrator to activate your subscription.
                </p>
              </div>
            </div>
          </div>
        );
      case 'expired':
        return (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Subscription Expired</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription has expired. Please select a plan to renew.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Choose a subscription plan to access the vendor dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Message */}
            {getStatusMessage()}

            {/* Subscription Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">₹{plan.price}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{plan.price_per_month} per month
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing || subscriptionStatus?.subscription_state === 'inactive_with_date'}
                    >
                      {subscribing && selectedPlan?.id === plan.id ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Current Subscription Info */}
            {subscriptionStatus?.subscription_end_date && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-semibold mb-2">Current Subscription</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {subscriptionStatus.subscription_start_date && (
                    <p>
                      Start Date: {new Date(subscriptionStatus.subscription_start_date).toLocaleDateString()}
                    </p>
                  )}
                  <p>
                    End Date: {new Date(subscriptionStatus.subscription_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
