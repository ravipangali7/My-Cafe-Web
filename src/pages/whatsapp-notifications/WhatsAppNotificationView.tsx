import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface CustomerItem {
  id: number;
  name: string;
  phone: string;
}

interface WhatsAppNotificationDetail {
  id: number;
  message: string;
  user: number;
  user_display: { id: number; name: string; phone: string } | null;
  customers_list: CustomerItem[];
  image: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  sent_count: number;
  total_count: number;
}

export default function WhatsAppNotificationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<WhatsAppNotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await api.get<WhatsAppNotificationDetail>(`/api/whatsapp-notifications/${id}/`);
      if (cancelled) return;
      if (res.error) {
        toast.error(res.error);
        setDetail(null);
      } else if (res.data) {
        setDetail(res.data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      sending: { label: 'Sending', variant: 'default' },
      sent: { label: 'Sent', variant: 'outline' },
      failed: { label: 'Failed', variant: 'destructive' },
    };
    const c = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }
  if (!detail) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Notification not found.</p>
          <Button variant="outline" onClick={() => navigate('/whatsapp-notifications')}>
            Back to list
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="WhatsApp Notification" description="View notification details">
        <Button variant="outline" onClick={() => navigate('/whatsapp-notifications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>
      </PageHeader>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Notification #{detail.id}
              {statusBadge(detail.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Message</p>
              <p className="mt-1 whitespace-pre-wrap">{detail.message}</p>
            </div>
            {detail.image_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Image</p>
                <img src={detail.image_url} alt="Notification" className="mt-1 max-w-xs rounded border" />
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                <p>{detail.user_display?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p>{detail.sent_count} / {detail.total_count} sent</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{new Date(detail.created_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {detail.customers_list && detail.customers_list.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recipients ({detail.customers_list.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                {detail.customers_list.map((c) => (
                  <li key={c.id} className="py-2 flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.phone}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
