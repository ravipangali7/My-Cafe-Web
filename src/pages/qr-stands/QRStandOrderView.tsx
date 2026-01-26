import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QRStandOrder {
  id: number;
  vendor: number;
  vendor_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  quantity: number;
  total_price: string;
  order_status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export default function QRStandOrderView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<QRStandOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get<{ order: QRStandOrder }>(`/api/qr-stands/orders/${id}/`);
      if (response.error || !response.data) {
        toast.error('Failed to fetch order');
        navigate('/qr-stands');
        return;
      }
      
      setOrder(response.data.order);
    } catch (error) {
      toast.error('Failed to fetch order');
      navigate('/qr-stands');
    } finally {
      setLoading(false);
    }
  }, [user, id, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, fetchOrder]);

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'accepted':
        return 'default';
      case 'saved':
        return 'warning';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading || !order) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/qr-stands" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`QR Stand Order #${order.id}`}
        backLink="/qr-stands"
        action={
          <Button variant="outline" onClick={() => navigate(`/qr-stands/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="space-y-6">
        <DetailCard title="Order Details">
          <DetailRow label="Order ID" value={`#${order.id}`} />
          <DetailRow
            label="Vendor"
            value={
              order.vendor_info ? (
                <div className="flex items-center gap-2">
                  {order.vendor_info.logo_url && (
                    <img
                      src={order.vendor_info.logo_url}
                      alt={order.vendor_info.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <span>{order.vendor_info.name}</span>
                </div>
              ) : (
                `Vendor #${order.vendor}`
              )
            }
          />
          <DetailRow label="Quantity" value={order.quantity} />
          <DetailRow
            label="Total Price"
            value={`₹${parseFloat(order.total_price).toFixed(2)}`}
          />
          <DetailRow
            label="Order Status"
            value={
              <StatusBadge
                status={order.order_status}
                variant={getOrderStatusVariant(order.order_status)}
              />
            }
          />
          <DetailRow
            label="Payment Status"
            value={
              <StatusBadge
                status={order.payment_status}
                variant={getPaymentStatusVariant(order.payment_status)}
              />
            }
          />
          <DetailRow
            label="Created At"
            value={new Date(order.created_at).toLocaleString()}
          />
          <DetailRow
            label="Updated At"
            value={new Date(order.updated_at).toLocaleString()}
          />
        </DetailCard>
      </div>
    </DashboardLayout>
  );
}
