import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Phone, 
  User, 
  Hash, 
  UtensilsCrossed,
  X,
  Check,
  Play,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, getOrderStatusVariant } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderItem {
  id: number;
  product_name: string;
  product_image_url: string | null;
  variant_info: {
    unit_name: string;
    unit_symbol: string;
    price: string;
  } | null;
  price: string;
  quantity: number;
  total: string;
}

interface Order {
  id: number;
  name: string;
  phone: string;
  table_no: string;
  status: string;
  payment_status: string;
  total: string;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

type DateFilter = 'today' | 'yesterday' | 'last7days' | 'all';

function getDateRange(filter: DateFilter): { start_date?: string; end_date?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  switch (filter) {
    case 'today':
      return { start_date: formatDate(today) };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start_date: formatDate(yesterday), end_date: formatDate(today) };
    }
    case 'last7days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start_date: formatDate(weekAgo) };
    }
    case 'all':
    default:
      return {};
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function LiveOrderCard({ 
  order, 
  onAccept, 
  onReject, 
  onRunning, 
  onReady,
  isUpdating 
}: { 
  order: Order;
  onAccept?: () => void;
  onReject?: () => void;
  onRunning?: () => void;
  onReady?: () => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="mb-4 border-l-4 border-l-primary">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Order #{order.id}</span>
              <StatusBadge status={order.status} variant={getOrderStatusVariant(order.status)} />
            </div>
            <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">₹{order.total}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{order.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{order.phone}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            <span>Table: {order.table_no}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Items ({order.items.length})</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                {item.product_image_url ? (
                  <img 
                    src={item.product_image_url} 
                    alt={item.product_name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product_name}</p>
                  {item.variant_info && (
                    <p className="text-xs text-muted-foreground">{item.variant_info.unit_symbol}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">x{item.quantity}</p>
                  <p className="text-xs text-muted-foreground">₹{item.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {onReject && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={onReject}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          )}
          {onAccept && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={onAccept}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
          )}
          {onRunning && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-1 bg-orange-500 hover:bg-orange-600"
              onClick={onRunning}
              disabled={isUpdating}
            >
              <Play className="h-4 w-4" />
              Start Cooking
            </Button>
          )}
          {onReady && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-1 bg-green-500 hover:bg-green-600"
              onClick={onReady}
              disabled={isUpdating}
            >
              <CheckCircle2 className="h-4 w-4" />
              Ready
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
  const [runningOrders, setRunningOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      const dateRange = getDateRange(dateFilter);
      const params = new URLSearchParams();
      params.append('page_size', '100');
      
      if (dateRange.start_date) {
        params.append('start_date', dateRange.start_date);
      }
      if (dateRange.end_date) {
        params.append('end_date', dateRange.end_date);
      }

      // Fetch orders for each status
      const [pendingRes, acceptedRes, runningRes] = await Promise.all([
        api.get<{ data: Order[] }>(`/api/orders/?${params.toString()}&status=pending`),
        api.get<{ data: Order[] }>(`/api/orders/?${params.toString()}&status=accepted`),
        api.get<{ data: Order[] }>(`/api/orders/?${params.toString()}&status=running`),
      ]);

      // Sort by created_at ascending (FIFO - oldest first)
      const sortByCreatedAt = (a: Order, b: Order) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

      if (!pendingRes.error && pendingRes.data) {
        setPendingOrders([...pendingRes.data.data].sort(sortByCreatedAt));
      }
      if (!acceptedRes.error && acceptedRes.data) {
        setAcceptedOrders([...acceptedRes.data.data].sort(sortByCreatedAt));
      }
      if (!runningRes.error && runningRes.data) {
        setRunningOrders([...runningRes.data.data].sort(sortByCreatedAt));
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: number, status: string, rejectReason?: string) => {
    setUpdatingOrderId(orderId);
    try {
      const formData = new FormData();
      formData.append('status', status);
      if (rejectReason) {
        formData.append('reject_reason', rejectReason);
      }

      const response = await api.post(`/api/orders/${orderId}/edit/`, formData, true);
      
      if (response.error) {
        toast.error('Failed to update order status');
        return false;
      }

      toast.success(`Order ${status === 'rejected' ? 'rejected' : status === 'accepted' ? 'accepted' : status === 'running' ? 'started cooking' : 'marked as ready'}`);
      await fetchOrders();
      return true;
    } catch (error) {
      toast.error('Failed to update order status');
      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAccept = (orderId: number) => {
    updateOrderStatus(orderId, 'accepted');
  };

  const handleRejectClick = (order: Order) => {
    setRejectingOrder(order);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingOrder) return;
    
    const success = await updateOrderStatus(rejectingOrder.id, 'rejected', rejectReason);
    if (success) {
      setRejectModalOpen(false);
      setRejectingOrder(null);
      setRejectReason('');
    }
  };

  const handleRunning = (orderId: number) => {
    updateOrderStatus(orderId, 'running');
  };

  const handleReady = (orderId: number) => {
    updateOrderStatus(orderId, 'ready');
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Live Orders" 
        description="Manage incoming orders in real-time"
        backLink="/orders"
        action={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchOrders()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Last refresh indicator */}
      <p className="text-xs text-muted-foreground mb-4">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Pending
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {pendingOrders.length} orders
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No pending orders</p>
                    </div>
                  ) : (
                    pendingOrders.map((order) => (
                      <LiveOrderCard
                        key={order.id}
                        order={order}
                        onAccept={() => handleAccept(order.id)}
                        onReject={() => handleRejectClick(order)}
                        isUpdating={updatingOrderId === order.id}
                      />
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Accepted Column */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Accepted
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {acceptedOrders.length} orders
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {acceptedOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No accepted orders</p>
                    </div>
                  ) : (
                    acceptedOrders.map((order) => (
                      <LiveOrderCard
                        key={order.id}
                        order={order}
                        onRunning={() => handleRunning(order.id)}
                        isUpdating={updatingOrderId === order.id}
                      />
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Running Column */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Running
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {runningOrders.length} orders
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {runningOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No orders in progress</p>
                    </div>
                  ) : (
                    runningOrders.map((order) => (
                      <LiveOrderCard
                        key={order.id}
                        order={order}
                        onReady={() => handleReady(order.id)}
                        isUpdating={updatingOrderId === order.id}
                      />
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order #{rejectingOrder?.id}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order. This will be sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Item out of stock, Kitchen closed, etc."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={updatingOrderId === rejectingOrder?.id}
            >
              {updatingOrderId === rejectingOrder?.id ? 'Rejecting...' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
