import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionStatusResponse {
  subscription_state: string;
  subscription_type: string | null;
  is_active: boolean;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  message: string | null;
}

function getPlanName(subscriptionType: string | null): string {
  if (!subscriptionType) return '—';
  return subscriptionType === 'yearly' ? 'Yearly' : 'Monthly';
}

function getStatusLabel(state: string): string {
  switch (state) {
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'no_subscription':
      return 'No subscription';
    case 'inactive_with_date':
      return 'Inactive';
    default:
      return state || '—';
  }
}

function getRemainingDays(endDate: string | null): number {
  if (!endDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SubscriptionDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<SubscriptionStatusResponse>('/api/subscription/status/');
        if (cancelled) return;
        if (response.error) {
          setError(response.error);
          return;
        }
        if (response.data) setData(response.data);
      } catch (e) {
        if (!cancelled) setError('Failed to load subscription');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const remainingDays = data?.subscription_end_date
    ? getRemainingDays(data.subscription_end_date)
    : 0;
  const isExpired =
    data?.subscription_state === 'expired' ||
    (data?.subscription_end_date ? new Date(data.subscription_end_date) < new Date() : true);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Subscription Details"
            description="Your current subscription information"
          />
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-8 flex flex-col items-center gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Subscription Plan</span>
                  <span className="font-medium">{getPlanName(data.subscription_type)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="flex items-center gap-2 font-medium">
                    {data.subscription_state === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {getStatusLabel(data.subscription_state)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </span>
                <span className="font-medium">{formatDate(data.subscription_start_date)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Expiry Date
                </span>
                <span className="font-medium">{formatDate(data.subscription_end_date)}</span>
              </div>

              {data.subscription_end_date && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <span className="text-sm text-muted-foreground block mb-1">Remaining Days</span>
                  <span
                    className={`text-2xl font-bold ${
                      isExpired ? 'text-destructive' : 'text-primary'
                    }`}
                  >
                    {isExpired ? 0 : remainingDays} {remainingDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}

              {data.message && (
                <p className="text-sm text-muted-foreground">{data.message}</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
