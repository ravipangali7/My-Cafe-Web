import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { api, getPublicInvoiceUrl, openInBrowser, isWebView } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { canEditItem, canDeleteOrder } from '@/lib/permissions';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
  total: number;
  product: { name: string } | null;
  product_variant: { 
    price: number;
    unit: { name: string; symbol: string } | null;
  } | null;
}

interface Order {
  id: string;
  name: string;
  phone: string;
  table_no: string;
  order_type?: string;
  address?: string | null;
  payment_method?: string;
  status: string;
  payment_status: string;
  total: number;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
  vendor: {
    id: string;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  order_items: OrderItem[];
}

export default function OrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ order: any }>(`/api/orders/${id}/`);
    if (response.error || !response.data) {
      toast.error('Order not found');
      navigate('/orders');
    } else {
      const orderData = response.data.order;
      setOrder({
        ...orderData,
        id: String(orderData.id),
        total: Number(orderData.total),
        vendor: orderData.vendor ? {
          id: String(orderData.vendor.id),
          name: orderData.vendor.name,
          phone: orderData.vendor.phone,
          logo_url: orderData.vendor.logo_url || null,
        } : null,
        order_items: (orderData.items || []).map((item: any) => ({
          id: String(item.id),
          price: Number(item.price),
          quantity: item.quantity,
          total: Number(item.total),
          product: { name: item.product_name },
          product_variant: {
            price: Number(item.variant_info?.price || 0),
            unit: {
              name: item.variant_info?.unit_name || '',
              symbol: item.variant_info?.unit_symbol || '',
            },
          },
        })),
      } as Order);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-refresh when page becomes visible again (e.g., after accepting/rejecting order on mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchOrder]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get(`/api/orders/${id}/delete/`);

    if (response.error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted');
      navigate('/orders');
    }
  }, [id, navigate]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!id || !order) return;
    
    setUpdatingStatus(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      
      const response = await api.post(`/api/orders/${id}/edit/`, formData, true);
      
      if (response.error) {
        toast.error('Failed to update order status');
      } else {
        toast.success('Order status updated');
        // Refresh order data
        await fetchOrder();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  }, [id, order, fetchOrder]);

  const handlePaymentStatusChange = useCallback(async (newPaymentStatus: string) => {
    if (!id || !order) return;
    
    setUpdatingPaymentStatus(true);
    try {
      const formData = new FormData();
      formData.append('payment_status', newPaymentStatus);
      
      const response = await api.post(`/api/orders/${id}/edit/`, formData, true);
      
      if (response.error) {
        toast.error('Failed to update payment status');
      } else {
        toast.success('Payment status updated');
        // Refresh order data
        await fetchOrder();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setUpdatingPaymentStatus(false);
    }
  }, [id, order, fetchOrder]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!id) return;

    setDownloadingInvoice(true);
    try {
      const url = await getPublicInvoiceUrl(Number(id));
      if (isWebView()) {
        openInBrowser(url);
        toast.success('Opening invoice in browser');
      } else {
        // Redirect to invoice page (same app)
        const path = new URL(url).pathname;
        window.location.href = path;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  }, [id]);

  if (loading || !order) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/orders" />
      </DashboardLayout>
    );
  }

  const itemColumns = [
    {
      key: 'product',
      label: 'Product',
      render: (item: OrderItem) => item.product?.name || '—',
    },
    {
      key: 'variant',
      label: 'Variant',
      render: (item: OrderItem) =>
        item.product_variant?.unit
          ? `${item.product_variant.unit.name} (${item.product_variant.unit.symbol})`
          : '—',
    },
    {
      key: 'price',
      label: 'Price',
      render: (item: OrderItem) => `₹${Number(item.price).toFixed(2)}`,
    },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'total',
      label: 'Total',
      render: (item: OrderItem) => `₹${Number(item.total).toFixed(2)}`,
    },
  ];

  const canEdit = order ? canEditItem(user, order) : false;
  const canDelete = canDeleteOrder(user);

  return (
    <DashboardLayout>
      <PageHeader
        title={<span className="font-bold text-lg">Order #{order.id}</span>}
        backLink="/orders"
        action={
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingInvoice ? 'Downloading...' : 'Download PDF Bill'}
            </Button>
            {(canEdit || canDelete) && (
              <>
                {canEdit && (
                  <Button variant="outline" onClick={() => navigate(`/orders/${id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailCard title="Order Details">
          <DetailRow label="Order ID" value={<span className="font-bold text-lg">#{order.id}</span>} />
          <DetailRow label="Customer Name" value={order.name} />
          <DetailRow label="Phone" value={order.phone} />
          <DetailRow label="Table No" value={order.table_no || '—'} />
          <DetailRow label="Order Type" value={order.order_type ? order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1) : 'Table'} />
          {order.order_type === 'delivery' && order.address && (
            <DetailRow label="Address" value={order.address} />
          )}
          {order.payment_method && (
            <DetailRow label="Payment Method" value={order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)} />
          )}
          <DetailRow
            label="Status"
            value={
              <div className="flex items-center gap-2">
                <Select 
                  value={order.status} 
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <StatusBadge status={order.status} variant={getOrderStatusVariant(order.status)} />
              </div>
            }
          />
          <DetailRow
            label="Payment Status"
            value={
              <div className="flex items-center gap-2">
                <Select 
                  value={order.payment_status} 
                  onValueChange={handlePaymentStatusChange}
                  disabled={updatingPaymentStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <StatusBadge status={order.payment_status} variant={getPaymentStatusVariant(order.payment_status)} />
              </div>
            }
          />
          <DetailRow label="Total" value={`₹${Number(order.total).toFixed(2)}`} />
          <DetailRow label="Created At" value={new Date(order.created_at).toLocaleString()} />
          <DetailRow label="Updated At" value={new Date(order.updated_at).toLocaleString()} />
        </DetailCard>

        <DetailCard title="Vendor Details">
          {order.vendor?.logo_url && (
            <DetailRow
              label="Logo"
              value={<img src={order.vendor.logo_url} alt="" className="h-12 w-12 rounded object-cover" />}
            />
          )}
          <DetailRow label="Vendor Name" value={order.vendor?.name} />
          <DetailRow label="Vendor Phone" value={order.vendor?.phone} />
        </DetailCard>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <DataTable columns={itemColumns} data={order.order_items || []} emptyMessage="No items" />
      </div>
    </DashboardLayout>
  );
}
