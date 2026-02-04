import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingCart, IndianRupee, Download, Clock, CheckCircle, XCircle, Play, Coffee, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { PremiumStatsCards, ScrollableStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell, CustomerInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { CardContent } from '@/components/ui/card';
import { api, fetchPaginated, downloadOrderInvoice, getPublicInvoiceUrl, openInBrowser, isWebView } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { canEditItem, canDeleteOrder } from '@/lib/permissions';
import { toast } from 'sonner';

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

interface OrderStats {
  total: number;
  pending: number;
  accepted: number;
  running: number;
  ready: number;
  rejected: number;
  completed: number;
  revenue: string;
}

export default function OrdersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status') || '';
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string>(statusFromUrl);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    running: 0,
    ready: 0,
    rejected: 0,
    completed: 0,
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
      if (appliedStatus) {
        params.status = appliedStatus;
      }
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
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
  }, [user, page, pageSize, appliedSearch, appliedUserId, appliedStatus, appliedStartDate, appliedEndDate]);

  const handleDownloadInvoice = useCallback(async (orderId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setDownloadingInvoiceId(orderId);
    try {
      if (isWebView()) {
        const url = await getPublicInvoiceUrl(orderId);
        openInBrowser(url);
        toast.success('Opening invoice in browser');
      } else {
        await downloadOrderInvoice(orderId);
        toast.success('Invoice downloaded successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
      }
      
      const queryString = api.buildQueryString(params);
      const response = await api.get<OrderStats>(`/api/stats/orders/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    setAppliedStatus(statusFromUrl);
  }, [statusFromUrl]);

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
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setUserId(null);
    setAppliedUserId(null);
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    setStartDate(start || '');
    setEndDate(end || '');
  };

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (item: Order) => (
        <span className="font-mono font-medium">#{item.id}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (item: Order) => (
        <CustomerInfoCell
          name={item.name}
          phone={item.phone}
          tableNo={item.table_no}
        />
      ),
    },
    ...(user?.is_superuser ? [{
      key: 'vendor',
      label: 'Vendor',
      hideOnMobile: true,
      render: (item: Order) => {
        if (!item.vendor) return <span className="text-muted-foreground">—</span>;
        return (
          <VendorInfoCell
            name={item.vendor.name}
            phone={item.vendor.phone}
            logoUrl={item.vendor.logo_url}
            size="sm"
          />
        );
      },
    }] : []),
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: (item: Order) => (
        <StatusBadge status={item.status} variant={getOrderStatusVariant(item.status)} />
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      hideOnMobile: true,
      render: (item: Order) => (
        <StatusBadge status={item.payment_status} variant={getPaymentStatusVariant(item.payment_status)} />
      ),
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right' as const,
      render: (item: Order) => (
        <span className="font-semibold">{formatCurrency(item.total)}</span>
      ),
    },
  ];

  const applyStatusFilter = (status: string) => {
    setAppliedStatus(status);
    setPage(1);
    if (status) {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.set('status', status);
        return next;
      });
    } else {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('status');
        return next;
      });
    }
  };

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingCart, variant: 'default' as const, onClick: () => applyStatusFilter('') },
    { label: 'Pending', value: stats.pending || 0, icon: Clock, variant: 'warning' as const, onClick: () => applyStatusFilter('pending') },
    { label: 'Accepted', value: stats.accepted || 0, icon: CheckCircle, variant: 'info' as const, onClick: () => applyStatusFilter('accepted') },
    { label: 'Running', value: stats.running || 0, icon: Play, variant: 'info' as const, onClick: () => applyStatusFilter('running') },
    { label: 'Ready', value: stats.ready || 0, icon: Coffee, variant: 'success' as const, onClick: () => applyStatusFilter('ready') },
    { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, variant: 'destructive' as const, onClick: () => applyStatusFilter('rejected') },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue || '0'), icon: IndianRupee, variant: 'highlight' as const },
  ];

  const renderMobileCard = (order: Order, index: number) => (
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-mono font-semibold text-foreground">Order #{order.id}</div>
          <CustomerInfoCell
            name={order.name}
            phone={order.phone}
            tableNo={order.table_no}
            className="mt-1"
          />
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-foreground">{formatCurrency(order.total)}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={order.status} variant={getOrderStatusVariant(order.status)} />
        <StatusBadge status={order.payment_status} variant={getPaymentStatusVariant(order.payment_status)} />
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadInvoice(order.id, e);
          }}
          disabled={downloadingInvoiceId === order.id}
        >
          <Download className="h-4 w-4 mr-1" />
          Invoice
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${order.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {canEditItem(user, order) && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${order.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canDeleteOrder(user) && (
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
        )}
      </div>
    </CardContent>
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title="Orders"
          description="Manage customer orders"
          action={
            <Button onClick={() => navigate('/orders/new')} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          }
        />

        {isMobile ? (
          <ScrollableStatsCards stats={statCards} loading={loadingStats} />
        ) : (
          <PremiumStatsCards stats={statCards} loading={loadingStats} columns={4} />
        )}
        
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          userId={userId}
          onUserIdChange={setUserId}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          showUserFilter={user?.is_superuser}
          placeholder="Search orders..."
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
          emptyMessage="No orders found"
          onRowClick={(item) => navigate(`/orders/${item.id}`)}
          actions={{
            onView: (item) => navigate(`/orders/${item.id}`),
            onEdit: canEditItem(user, {}) ? (item) => navigate(`/orders/${item.id}/edit`) : undefined,
            onDelete: canDeleteOrder(user) ? (item) => setDeleteId(item.id) : undefined,
            custom: (item) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownloadInvoice(item.id)}
                  disabled={downloadingInvoiceId === item.id}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/orders/${item.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {canEditItem(user, item) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/orders/${item.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteOrder(user) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
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
          title="Delete Order"
          description="This action cannot be undone. This will permanently delete the order."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
