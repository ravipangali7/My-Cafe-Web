import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PremiumTable,
  MobileCardHeader,
  MobileCardContent,
  MobileCardRow,
} from '@/components/ui/premium-table';
import { StatusBadge, getOrderStatusVariant } from '@/components/ui/status-badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PendingQROrder, PendingKYCRequest, ShareholderWithdrawal } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { getMediaProxyUrl } from '@/lib/api';
import {
  Eye,
  QrCode,
  FileCheck,
  Wallet,
} from 'lucide-react';

interface SystemPendingTablesProps {
  pendingQrOrders: PendingQROrder[];
  pendingKycRequests: PendingKYCRequest[];
  pendingWithdrawals: ShareholderWithdrawal[];
  loading?: boolean;
}

export function SystemPendingTables({
  pendingQrOrders,
  pendingKycRequests,
  pendingWithdrawals,
  loading = false,
}: SystemPendingTablesProps) {
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

  // QR Orders columns (compact for card view)
  const qrOrderColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: PendingQROrder) => <span className="font-medium text-xs">#{item.id}</span>,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: PendingQROrder) => (
        <div className="flex items-center gap-1.5">
          <Avatar className="h-6 w-6">
            {item.vendor_info?.logo_url ? (
              <AvatarImage src={getMediaProxyUrl(item.vendor_info.logo_url)} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {item.vendor_info?.name?.slice(0, 2).toUpperCase() || 'V'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate max-w-[80px]">
            {item.vendor_info?.name || `#${item.vendor}`}
          </span>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'total_price',
      label: 'Price',
      render: (item: PendingQROrder) => (
        <span className="font-semibold text-xs">{formatCurrency(item.total_price)}</span>
      ),
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (item: PendingQROrder) => <StatusBadge status={item.order_status} variant={getOrderStatusVariant(item.order_status)} size="sm" />,
    },
  ];

  // KYC columns (compact for card view)
  const kycColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: PendingKYCRequest) => <span className="font-medium text-xs">#{item.id}</span>,
    },
    {
      key: 'name',
      label: 'Vendor',
      render: (item: PendingKYCRequest) => (
        <div>
          <p className="font-medium text-xs">{item.name || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground">{item.country_code}{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (item: PendingKYCRequest) => (
        <span className="text-muted-foreground text-xs">
          {formatTimeAgo(item.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: PendingKYCRequest) => <StatusBadge status={item.kyc_status} size="sm" />,
    },
  ];

  // Withdrawals columns (compact for card view)
  const withdrawalColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: ShareholderWithdrawal) => <span className="font-medium text-xs">#{item.id}</span>,
    },
    {
      key: 'user',
      label: 'Shareholder',
      render: (item: ShareholderWithdrawal) => (
        <div className="flex items-center gap-1.5">
          <Avatar className="h-6 w-6">
            {item.user_info?.logo_url ? (
              <AvatarImage src={getMediaProxyUrl(item.user_info.logo_url)} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {item.user_info?.name?.slice(0, 2).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs truncate max-w-[80px]">
            {item.user_info?.name || `#${item.user}`}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: ShareholderWithdrawal) => (
        <span className="font-semibold text-xs text-green-600">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ShareholderWithdrawal) => <StatusBadge status={item.status} size="sm" />,
    },
  ];

  // Mobile card renderers
  const renderQrOrderMobileCard = (item: PendingQROrder) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/qr-stands/${item.id}`)}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">#{item.id}</p>
            <p className="text-xs text-muted-foreground">
              {item.vendor_info?.name || `Vendor #${item.vendor}`}
            </p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow label="Price" value={formatCurrency(item.total_price)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.order_status} size="sm" />} />
      </MobileCardContent>
    </>
  );

  const renderKycMobileCard = (item: PendingKYCRequest) => (
    <>
      <MobileCardHeader onClick={() => navigate('/kyc-management')}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <FileCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">{item.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{item.country_code}{item.phone}</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow label="Submitted" value={formatTimeAgo(item.created_at)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.kyc_status} size="sm" />} />
      </MobileCardContent>
    </>
  );

  const renderWithdrawalMobileCard = (item: ShareholderWithdrawal) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/withdrawals/${item.id}`)}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {item.user_info?.logo_url ? (
              <AvatarImage src={getMediaProxyUrl(item.user_info.logo_url)} />
            ) : null}
            <AvatarFallback className="text-xs">
              {item.user_info?.name?.slice(0, 2).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{item.user_info?.name || `User #${item.user}`}</p>
            <p className="text-xs text-muted-foreground">{item.user_info?.share_percentage}% share</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow
          label="Amount"
          value={<span className="font-semibold text-green-600">{formatCurrency(item.amount)}</span>}
        />
        <MobileCardRow label="Status" value={<StatusBadge status={item.status} size="sm" />} />
      </MobileCardContent>
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* QR Orders Card */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-500" />
              QR Orders
            </div>
            {pendingQrOrders.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingQrOrders.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col">
          <div className="flex-1">
            <PremiumTable
              columns={qrOrderColumns}
              data={pendingQrOrders.slice(0, 5) as (PendingQROrder & { id: number })[]}
              loading={loading}
              emptyMessage="No pending orders"
              emptyIcon={<QrCode className="h-8 w-8 text-muted-foreground/50" />}
              mobileCard={renderQrOrderMobileCard}
              onRowClick={(item) => navigate(`/qr-stands/${item.id}`)}
              compact
            />
          </div>
          {pendingQrOrders.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-xs"
                onClick={() => navigate('/qr-stands?order_status=pending')}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View All ({pendingQrOrders.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Card */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-orange-500" />
              KYC Requests
            </div>
            {pendingKycRequests.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingKycRequests.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col">
          <div className="flex-1">
            <PremiumTable
              columns={kycColumns}
              data={pendingKycRequests.slice(0, 5) as (PendingKYCRequest & { id: number })[]}
              loading={loading}
              emptyMessage="No pending requests"
              emptyIcon={<FileCheck className="h-8 w-8 text-muted-foreground/50" />}
              mobileCard={renderKycMobileCard}
              onRowClick={() => navigate('/kyc-management')}
              compact
            />
          </div>
          {pendingKycRequests.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-xs"
                onClick={() => navigate('/kyc-management')}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View All ({pendingKycRequests.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawals Card */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" />
              Withdrawals
            </div>
            {pendingWithdrawals.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingWithdrawals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col">
          <div className="flex-1">
            <PremiumTable
              columns={withdrawalColumns}
              data={pendingWithdrawals.slice(0, 5) as (ShareholderWithdrawal & { id: number })[]}
              loading={loading}
              emptyMessage="No pending withdrawals"
              emptyIcon={<Wallet className="h-8 w-8 text-muted-foreground/50" />}
              mobileCard={renderWithdrawalMobileCard}
              onRowClick={(item) => navigate(`/withdrawals/${item.id}`)}
              compact
            />
          </div>
          {pendingWithdrawals.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-xs"
                onClick={() => navigate('/withdrawals?status=pending')}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View All ({pendingWithdrawals.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
