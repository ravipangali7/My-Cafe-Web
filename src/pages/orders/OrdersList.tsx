import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingCart, DollarSign, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api, fetchPaginated, PaginatedResponse, downloadOrderInvoice } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { canEditItem, canDeleteItem } from '@/lib/permissions';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
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

  const handleDownloadInvoice = useCallback(async (orderId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent row click navigation
    }
    setDownloadingInvoiceId(orderId);
    try {
      await downloadOrderInvoice(orderId);
      toast.success('Invoice downloaded successfully');
      setSelectedOrderId(null); // Close dialog if open
    } catch (error: any) {
      toast.error(error.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, []);

  const handleViewOrder = useCallback((orderId: number) => {
    setSelectedOrderId(null); // Close dialog
    navigate(`/orders/${orderId}`);
  }, [navigate]);

  const handleEditOrder = useCallback((orderId: number) => {
    setSelectedOrderId(null); // Close dialog
    navigate(`/orders/${orderId}/edit`);
  }, [navigate]);

  const handleDeleteClick = useCallback((orderId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedOrderId(null); // Close dialog if open
    setDeleteId(orderId);
  }, []);

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
      render: (item: Order) => {
        const canEdit = canEditItem(user, item);
        const canDelete = canDeleteItem(user, item);
        
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDownloadInvoice(item.id, e)}
                    disabled={downloadingInvoiceId === item.id}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF Bill</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOrder(item.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Order</TooltipContent>
              </Tooltip>
              
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrder(item.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Order</TooltipContent>
                </Tooltip>
              )}
              
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(item.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Order</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingCart, color: 'text-foreground' },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.revenue || '0').toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
  ];

  // Get selected order for mobile dialog
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
  const canEditSelected = selectedOrder ? canEditItem(user, selectedOrder) : false;
  const canDeleteSelected = selectedOrder ? canDeleteItem(user, selectedOrder) : false;

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

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            orders.map((order) => {
              const canEdit = canEditItem(user, order);
              const canDelete = canDeleteItem(user, order);
              
              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-base">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-base">₹{Number(order.total).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <StatusBadge status={order.status} variant={getOrderStatusVariant(order.status)} />
                      <StatusBadge status={order.payment_status} variant={getPaymentStatusVariant(order.payment_status)} />
                      <span className="text-sm text-muted-foreground">Table: {order.table_no}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={orders} 
          loading={loading} 
          emptyMessage="No orders found"
          onRowClick={(item) => navigate(`/orders/${item.id}`)}
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

      {/* Mobile Actions Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                {selectedOrder.name} • ₹{Number(selectedOrder.total).toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleViewOrder(selectedOrder.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Order
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDownloadInvoice(selectedOrder.id)}
                disabled={downloadingInvoiceId === selectedOrder.id}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingInvoiceId === selectedOrder.id ? 'Downloading...' : 'Download PDF Bill'}
              </Button>
              
              {canEditSelected && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleEditOrder(selectedOrder.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
              )}
              
              {canDeleteSelected && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => handleDeleteClick(selectedOrder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order.
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
