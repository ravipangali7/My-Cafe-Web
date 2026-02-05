import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, QrCode, Clock, CheckCircle, Truck, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { CardContent } from '@/components/ui/card';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface QRStandStats {
  total: number;
  pending: number;
  accepted: number;
  delivered: number;
  revenue: string;
}

export default function QRStandOrdersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<QRStandOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [stats, setStats] = useState<QRStandStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    delivered: 0,
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
      
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
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
  }, [user, page, pageSize, appliedSearch, appliedStartDate, appliedEndDate]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const response = await api.get<QRStandStats>('/api/stats/qr-stands/');
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch QR stand stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    setStartDate(start || '');
    setEndDate(end || '');
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchStats();
    }
  }, [user, fetchOrders, fetchStats]);

  // Refetch when user returns to tab (real-time data)
  useEffect(() => {
    if (!user) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user, fetchOrders, fetchStats]);

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
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
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
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, [field]: value } : order
        ));
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (item: QRStandOrder) => (
        <span className="font-mono font-medium">#{item.id}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: QRStandOrder) => {
        if (!item.vendor_info) return <span className="text-muted-foreground">Vendor #{item.vendor}</span>;
        return (
          <VendorInfoCell
            name={item.vendor_info.name}
            phone={item.vendor_info.phone}
            logoUrl={item.vendor_info.logo_url}
            size="sm"
          />
        );
      },
    },
    {
      key: 'quantity',
      label: 'Qty',
      align: 'center' as const,
      render: (item: QRStandOrder) => (
        <span className="font-medium">{item.quantity}</span>
      ),
    },
    {
      key: 'total_price',
      label: 'Total',
      align: 'right' as const,
      render: (item: QRStandOrder) => (
        <span className="font-semibold">{formatCurrency(item.total_price)}</span>
      ),
    },
    {
      key: 'order_status',
      label: 'Order Status',
      hideOnMobile: true,
      render: (item: QRStandOrder) => (
        user?.is_superuser ? (
          <Select
            value={item.order_status}
            onValueChange={(value) => handleStatusChange(item.id, 'order_status', value)}
            disabled={updatingOrderId === item.id}
          >
            <SelectTrigger className="w-[130px] h-8">
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
      label: 'Payment',
      hideOnMobile: true,
      render: (item: QRStandOrder) => (
        user?.is_superuser ? (
          <Select
            value={item.payment_status}
            onValueChange={(value) => handleStatusChange(item.id, 'payment_status', value)}
            disabled={updatingOrderId === item.id}
          >
            <SelectTrigger className="w-[120px] h-8">
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
  ];

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: QrCode, variant: 'default' as const },
    { label: 'Pending', value: stats.pending || 0, icon: Clock, variant: 'warning' as const },
    { label: 'Accepted', value: stats.accepted || 0, icon: CheckCircle, variant: 'info' as const },
    { label: 'Delivered', value: stats.delivered || 0, icon: Truck, variant: 'success' as const },
    { label: 'Revenue', value: formatCurrency(stats.revenue || '0'), icon: IndianRupee, variant: 'highlight' as const },
  ];

  const renderMobileCard = (order: QRStandOrder, index: number) => (
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-mono font-semibold text-foreground">Order #{order.id}</div>
          {order.vendor_info ? (
            <VendorInfoCell
              name={order.vendor_info.name}
              phone={order.vendor_info.phone}
              logoUrl={order.vendor_info.logo_url}
              size="sm"
              className="mt-1"
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Vendor #{order.vendor}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-foreground">{formatCurrency(order.total_price)}</div>
          <div className="text-xs text-muted-foreground">Qty: {order.quantity}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={order.order_status} variant={getOrderStatusVariant(order.order_status)} />
        <StatusBadge status={order.payment_status} variant={getPaymentStatusVariant(order.payment_status)} />
      </div>

      <MobileCardRow
        label="Created"
        value={new Date(order.created_at).toLocaleDateString()}
        className="mt-2"
      />
      
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/qr-stands/${order.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {user?.is_superuser && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/qr-stands/${order.id}`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(order.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </CardContent>
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title="QR Stand Orders"
          description="Manage QR stand orders"
          action={
            <Button onClick={() => navigate('/qr-stands/new')} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          }
        />

        <PremiumStatsCards stats={statCards} loading={loadingStats} columns={3} />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          showUserFilter={false}
          placeholder="Search QR orders..."
          additionalFilters={
            <DateFilterButtons
              activeFilter={dateFilter}
              onFilterChange={handleDateFilterChange}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              compact
            />
          }
        />

        <PremiumTable
          columns={columns}
          data={orders}
          loading={loading}
          showSerialNumber={false}
          emptyMessage="No QR stand orders found"
          onRowClick={(item) => navigate(`/qr-stands/${item.id}`)}
          actions={user?.is_superuser ? {
            onView: (item) => navigate(`/qr-stands/${item.id}`),
            onEdit: (item) => navigate(`/qr-stands/${item.id}`),
            onDelete: (item) => setDeleteId(item.id),
          } : {
            onView: (item) => navigate(`/qr-stands/${item.id}`),
          }}
          mobileCard={renderMobileCard}
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

        <ConfirmationModal
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete QR Stand Order"
          description="Are you sure you want to delete this order? This action cannot be undone."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
