import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [updating, setUpdating] = useState(false);

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

  const handleStatusChange = async (field: 'order_status' | 'payment_status', value: string) => {
    if (!order || !user?.is_superuser || updating) return;

    setUpdating(true);
    try {
      const response = await api.put(`/api/qr-stands/orders/${id}/update/`, {
        [field]: value,
      });

      if (response.error) {
        toast.error(response.error || 'Failed to update order');
      } else {
        toast.success('Order updated successfully');
        // Update local state
        setOrder(prev => prev ? { ...prev, [field]: value } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdating(false);
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
              user?.is_superuser ? (
                <Select
                  value={order.order_status}
                  onValueChange={(value) => handleStatusChange('order_status', value)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge
                  status={order.order_status}
                  variant={getOrderStatusVariant(order.order_status)}
                />
              )
            }
          />
          <DetailRow
            label="Payment Status"
            value={
              user?.is_superuser ? (
                <Select
                  value={order.payment_status}
                  onValueChange={(value) => handleStatusChange('payment_status', value)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge
                  status={order.payment_status}
                  variant={getPaymentStatusVariant(order.payment_status)}
                />
              )
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
