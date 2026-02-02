import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PremiumTable,
  MobileCardHeader,
  MobileCardContent,
  MobileCardRow,
} from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Eye, ShoppingCart, QrCode } from 'lucide-react';
import { PendingOrder, PendingQROrder } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';

interface PendingOrdersSectionProps {
  pendingOrders: PendingOrder[];
  pendingQrOrders: PendingQROrder[];
  loading?: boolean;
}

export function PendingOrdersSection({
  pendingOrders,
  pendingQrOrders,
  loading = false,
}: PendingOrdersSectionProps) {
  const navigate = useNavigate();

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Orders table columns
  const orderColumns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (item: PendingOrder) => (
        <span className="font-medium">#{item.id}</span>
      ),
    },
    {
      key: 'name',
      label: 'Customer',
      render: (item: PendingOrder) => (
        <div>
          <p className="font-medium truncate max-w-[120px]">{item.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{item.phone}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'table_no',
      label: 'Table',
      render: (item: PendingOrder) => item.table_no || '-',
    },
    {
      key: 'total',
      label: 'Total',
      render: (item: PendingOrder) => (
        <span className="font-semibold">{formatCurrency(item.total)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (item: PendingOrder) => (
        <span className="text-muted-foreground text-sm">
          {formatTimeAgo(item.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  // QR Orders table columns
  const qrOrderColumns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (item: PendingQROrder) => (
        <span className="font-medium">#{item.id}</span>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty',
      render: (item: PendingQROrder) => (
        <span className="font-medium">{item.quantity}</span>
      ),
    },
    {
      key: 'total_price',
      label: 'Price',
      render: (item: PendingQROrder) => (
        <span className="font-semibold">{formatCurrency(item.total_price)}</span>
      ),
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (item: PendingQROrder) => (
        <StatusBadge status={item.order_status} />
      ),
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (item: PendingQROrder) => (
        <span className="text-muted-foreground text-sm">
          {formatTimeAgo(item.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  // Mobile card for orders
  const renderOrderMobileCard = (item: PendingOrder) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/orders/${item.id}`)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <ShoppingCart className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="font-semibold">#{item.id}</p>
            <p className="text-sm text-muted-foreground">{item.name || 'Customer'}</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow label="Table" value={item.table_no || '-'} />
        <MobileCardRow label="Total" value={formatCurrency(item.total)} />
        <MobileCardRow label="Time" value={formatTimeAgo(item.created_at)} />
      </MobileCardContent>
    </>
  );

  // Mobile card for QR orders
  const renderQrOrderMobileCard = (item: PendingQROrder) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/qr-stands/${item.id}`)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <QrCode className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="font-semibold">#{item.id}</p>
            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow label="Price" value={formatCurrency(item.total_price)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.order_status} />} />
        <MobileCardRow label="Time" value={formatTimeAgo(item.created_at)} />
      </MobileCardContent>
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pending Orders
              </CardTitle>
              <CardDescription>
                {pendingOrders.length} orders awaiting processing
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/orders?status=pending')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PremiumTable
            columns={orderColumns}
            data={pendingOrders.slice(0, 5) as (PendingOrder & { id: number })[]}
            loading={loading}
            emptyMessage="No pending orders"
            emptyIcon={<ShoppingCart className="h-12 w-12 text-muted-foreground/50" />}
            mobileCard={renderOrderMobileCard}
            onRowClick={(item) => navigate(`/orders/${item.id}`)}
          />
        </CardContent>
      </Card>

      {/* Pending QR Stand Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Pending QR Stand Orders
              </CardTitle>
              <CardDescription>
                {pendingQrOrders.length} QR orders awaiting processing
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/qr-stands?order_status=pending')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PremiumTable
            columns={qrOrderColumns}
            data={pendingQrOrders.slice(0, 5) as (PendingQROrder & { id: number })[]}
            loading={loading}
            emptyMessage="No pending QR orders"
            emptyIcon={<QrCode className="h-12 w-12 text-muted-foreground/50" />}
            mobileCard={renderQrOrderMobileCard}
            onRowClick={(item) => navigate(`/qr-stands/${item.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
