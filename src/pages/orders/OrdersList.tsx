import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
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

interface Order {
  id: number;
  name: string;
  phone: string;
  table_no: string;
  status: string;
  payment_status: string;
  total: string;
  created_at: string;
  vendor?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
}

export default function OrdersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    revenue: '0',
  });
  const [loadingStats, setLoadingStats] = useState(true);

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
      
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }

      const response = await fetchPaginated<Order>('/api/orders/', params);
      
      if (response.error) {
        toast.error('Failed to fetch orders');
      } else if (response.data) {
        setOrders(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch, appliedUserId]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      
      const queryString = api.buildQueryString(params);
      const response = await api.get<{
        total: number;
        revenue: string;
      }>(`/api/stats/orders/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchStats();
    }
  }, [user, fetchOrders, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const response = await api.get(`/api/orders/${deleteId}/delete/`);

    if (response.error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted');
      fetchOrders();
      fetchStats();
    }
    setDeleteId(null);
  }, [deleteId, fetchOrders, fetchStats]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedUserId(userId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setUserId(null);
    setAppliedUserId(null);
    setPage(1);
  };

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (item: Order) => `#${item.id}`,
    },
    { key: 'name', label: 'Customer' },
    ...(user?.is_superuser ? [{
      key: 'vendor',
      label: 'User',
      render: (item: Order) => {
        if (!item.vendor) return '—';
        return (
          <div className="flex items-center gap-2">
            {item.vendor.logo_url ? (
              <img 
                src={item.vendor.logo_url} 
                alt={item.vendor.name} 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs">
                {item.vendor.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">{item.vendor.name}</div>
              <div className="text-xs text-muted-foreground">{item.vendor.phone}</div>
            </div>
          </div>
        );
      },
    }] : []),
    { key: 'table_no', label: 'Table' },
    {
      key: 'status',
      label: 'Status',
      render: (item: Order) => (
        <StatusBadge status={item.status} variant={getOrderStatusVariant(item.status)} />
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (item: Order) => (
        <StatusBadge status={item.payment_status} variant={getPaymentStatusVariant(item.payment_status)} />
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (item: Order) => `₹${Number(item.total).toFixed(2)}`,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (item: Order) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Order) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/${item.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/${item.id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingCart, color: 'text-foreground' },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.revenue || '0').toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Orders"
        description="Manage customer orders"
        action={
          <Button onClick={() => navigate('/orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        }
      />

      <StatsCards stats={statCards} loading={loadingStats} />
      
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        userId={userId}
        onUserIdChange={setUserId}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        showUserFilter={user?.is_superuser}
      />

      <DataTable columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />

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
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
