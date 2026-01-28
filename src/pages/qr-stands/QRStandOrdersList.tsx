import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterBar } from '@/components/ui/filter-bar';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export default function QRStandOrdersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<QRStandOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      
      if (appliedSearch) {
        params.search = appliedSearch;
      }

      const response = await fetchPaginated<QRStandOrder>('/api/qr-stands/orders/', params);
      
      if (response.error) {
        toast.error('Failed to fetch QR stand orders');
      } else if (response.data) {
        setOrders(response.data.data || response.data.orders || []);
        setCount(response.data.count || 0);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch QR stand orders');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await api.delete(`/api/qr-stands/orders/${deleteId}/delete/`);
      if (response.error) {
        toast.error(response.error || 'Failed to delete order');
      } else {
        toast.success('Order deleted successfully');
        setDeleteId(null);
        fetchOrders();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

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

  const handleStatusChange = async (orderId: number, field: 'order_status' | 'payment_status', value: string) => {
    if (!user?.is_superuser || updatingOrderId) return;

    setUpdatingOrderId(orderId);
    try {
      const response = await api.put(`/api/qr-stands/orders/${orderId}/update/`, {
        [field]: value,
      });

      if (response.error) {
        toast.error(response.error || 'Failed to update order');
      } else {
        toast.success('Order updated successfully');
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, [field]: value } : order
        ));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: QRStandOrder) => `#${item.id}`,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: QRStandOrder) => item.vendor_info?.name || `Vendor #${item.vendor}`,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (item: QRStandOrder) => item.quantity,
    },
    {
      key: 'total_price',
      label: 'Total Price',
      render: (item: QRStandOrder) => `₹${parseFloat(item.total_price).toFixed(2)}`,
    },
    {
      key: 'order_status',
      label: 'Order Status',
      render: (item: QRStandOrder) => (
        user?.is_superuser ? (
          <Select
            value={item.order_status}
            onValueChange={(value) => handleStatusChange(item.id, 'order_status', value)}
            disabled={updatingOrderId === item.id}
          >
            <SelectTrigger className="w-[140px]">
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
          <StatusBadge status={item.order_status} variant={getOrderStatusVariant(item.order_status)} />
        )
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (item: QRStandOrder) => (
        user?.is_superuser ? (
          <Select
            value={item.payment_status}
            onValueChange={(value) => handleStatusChange(item.id, 'payment_status', value)}
            disabled={updatingOrderId === item.id}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={item.payment_status} variant={getPaymentStatusVariant(item.payment_status)} />
        )
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: QRStandOrder) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null;

  return (
    <DashboardLayout>
      <PageHeader
        title="QR Stand Orders"
        description="Manage QR stand orders"
        action={
          <Button onClick={() => navigate('/qr-stands/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={() => {
          setAppliedSearch(search);
          setPage(1);
        }}
        onClear={() => {
          setSearch('');
          setAppliedSearch('');
          setPage(1);
        }}
        showUserFilter={false}
      />

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No QR stand orders found</div>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-base">Order #{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.vendor_info?.name || `Vendor #${order.vendor}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-base">₹{parseFloat(order.total_price).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <StatusBadge status={order.order_status} variant={getOrderStatusVariant(order.order_status)} />
                    <StatusBadge status={order.payment_status} variant={getPaymentStatusVariant(order.payment_status)} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={orders} 
          loading={loading} 
          emptyMessage="No QR stand orders found"
          onRowClick={(item) => navigate(`/qr-stands/${item.id}`)}
        />
      )}

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {selectedOrder && (
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Stand Order #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                {selectedOrder.vendor_info?.name || `Vendor #${selectedOrder.vendor}`} • ₹{parseFloat(selectedOrder.total_price).toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedOrderId(null);
                  navigate(`/qr-stands/${selectedOrder.id}`);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              {user?.is_superuser && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedOrderId(null);
                      navigate(`/qr-stands/${selectedOrder.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedOrderId(null);
                      setDeleteId(selectedOrder.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QR Stand Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
