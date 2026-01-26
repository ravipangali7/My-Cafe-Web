import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  const [orders, setOrders] = useState<QRStandOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

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
        <StatusBadge status={item.order_status} variant={getOrderStatusVariant(item.order_status)} />
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (item: QRStandOrder) => (
        <StatusBadge status={item.payment_status} variant={getPaymentStatusVariant(item.payment_status)} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: QRStandOrder) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: QRStandOrder) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/qr-stands/${item.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/qr-stands/${item.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {user?.is_superuser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(item.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

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

      <DataTable 
        columns={columns} 
        data={orders} 
        loading={loading} 
        emptyMessage="No QR stand orders found" 
      />

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
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
