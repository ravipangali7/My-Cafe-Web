import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';

interface SubscriptionSummaryProps {
  subscription: {
    type: string | null;
    end_date: string | null;
    status: string;
  };
}

export function SubscriptionSummary({ subscription }: SubscriptionSummaryProps) {
  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {subscription.status === 'inactive' ? 'Inactive' : 'No Subscription'}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDuration = () => {
    if (!subscription.type) return 'N/A';
    return subscription.type === 'yearly' ? 'Yearly' : 'Monthly';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Subscription</div>
              <div className="text-xs text-muted-foreground">
                {getDuration()} • Expires {formatDate(subscription.end_date)}
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  );
}
