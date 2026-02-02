import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  PremiumTable,
  MobileCardHeader,
  MobileCardContent,
  MobileCardRow,
  MobileCardFooter,
} from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PendingQROrder, PendingKYCRequest, ShareholderWithdrawal } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { getMediaProxyUrl } from '@/lib/api';
import {
  Eye,
  QrCode,
  FileCheck,
  Wallet,
  User,
  Phone,
  Clock,
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
  const [activeTab, setActiveTab] = useState('qr-orders');

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

  // QR Orders columns
  const qrOrderColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: PendingQROrder) => <span className="font-medium">#{item.id}</span>,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: PendingQROrder) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {item.vendor_info?.logo_url ? (
              <AvatarImage src={getMediaProxyUrl(item.vendor_info.logo_url)} />
            ) : null}
            <AvatarFallback className="text-xs">
              {item.vendor_info?.name?.slice(0, 2).toUpperCase() || 'V'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate max-w-[100px]">
            {item.vendor_info?.name || `Vendor #${item.vendor}`}
          </span>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'quantity',
      label: 'Qty',
      render: (item: PendingQROrder) => item.quantity,
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
      render: (item: PendingQROrder) => <StatusBadge status={item.order_status} />,
    },
  ];

  // KYC columns
  const kycColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: PendingKYCRequest) => <span className="font-medium">#{item.id}</span>,
    },
    {
      key: 'name',
      label: 'Vendor',
      render: (item: PendingKYCRequest) => (
        <div>
          <p className="font-medium">{item.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{item.country_code}{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'kyc_document_type',
      label: 'Doc Type',
      render: (item: PendingKYCRequest) => (
        <span className="capitalize">{item.kyc_document_type?.replace('_', ' ') || 'N/A'}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (item: PendingKYCRequest) => (
        <span className="text-muted-foreground text-sm">
          {formatTimeAgo(item.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: PendingKYCRequest) => <StatusBadge status={item.kyc_status} />,
    },
  ];

  // Withdrawals columns
  const withdrawalColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: ShareholderWithdrawal) => <span className="font-medium">#{item.id}</span>,
    },
    {
      key: 'user',
      label: 'Shareholder',
      render: (item: ShareholderWithdrawal) => (
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
            <p className="text-sm font-medium">{item.user_info?.name || `User #${item.user}`}</p>
            <p className="text-xs text-muted-foreground">{item.user_info?.share_percentage}% share</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: ShareholderWithdrawal) => (
        <span className="font-semibold text-green-600">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested',
      render: (item: ShareholderWithdrawal) => (
        <span className="text-muted-foreground text-sm">
          {formatTimeAgo(item.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ShareholderWithdrawal) => <StatusBadge status={item.status} />,
    },
  ];

  // Mobile card renderers
  const renderQrOrderMobileCard = (item: PendingQROrder) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/qr-stands/${item.id}`)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">#{item.id}</p>
            <p className="text-sm text-muted-foreground">
              {item.vendor_info?.name || `Vendor #${item.vendor}`}
            </p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow label="Quantity" value={item.quantity} />
        <MobileCardRow label="Price" value={formatCurrency(item.total_price)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.order_status} />} />
      </MobileCardContent>
    </>
  );

  const renderKycMobileCard = (item: PendingKYCRequest) => (
    <>
      <MobileCardHeader onClick={() => navigate('/kyc-management')}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{item.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">{item.country_code}{item.phone}</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow
          label="Document"
          value={item.kyc_document_type?.replace('_', ' ') || 'N/A'}
        />
        <MobileCardRow label="Submitted" value={formatTimeAgo(item.created_at)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.kyc_status} />} />
      </MobileCardContent>
    </>
  );

  const renderWithdrawalMobileCard = (item: ShareholderWithdrawal) => (
    <>
      <MobileCardHeader onClick={() => navigate(`/withdrawals/${item.id}`)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {item.user_info?.logo_url ? (
              <AvatarImage src={getMediaProxyUrl(item.user_info.logo_url)} />
            ) : null}
            <AvatarFallback>
              {item.user_info?.name?.slice(0, 2).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{item.user_info?.name || `User #${item.user}`}</p>
            <p className="text-sm text-muted-foreground">{item.user_info?.share_percentage}% share</p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow
          label="Amount"
          value={<span className="font-semibold text-green-600">{formatCurrency(item.amount)}</span>}
        />
        <MobileCardRow label="Requested" value={formatTimeAgo(item.created_at)} />
        <MobileCardRow label="Status" value={<StatusBadge status={item.status} />} />
      </MobileCardContent>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          Pending Actions
        </CardTitle>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="qr-orders" className="text-xs sm:text-sm">
              QR Orders
              {pendingQrOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                  {pendingQrOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kyc" className="text-xs sm:text-sm">
              KYC
              {pendingKycRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                  {pendingKycRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs sm:text-sm">
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                  {pendingWithdrawals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr-orders" className="mt-0">
            <PremiumTable
              columns={qrOrderColumns}
              data={pendingQrOrders.slice(0, 5) as (PendingQROrder & { id: number })[]}
              loading={loading}
              emptyMessage="No pending QR orders"
              emptyIcon={<QrCode className="h-10 w-10 text-muted-foreground/50" />}
              mobileCard={renderQrOrderMobileCard}
              onRowClick={(item) => navigate(`/qr-stands/${item.id}`)}
            />
            {pendingQrOrders.length > 5 && (
              <div className="mt-3 text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/qr-stands?order_status=pending')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All ({pendingQrOrders.length})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="kyc" className="mt-0">
            <PremiumTable
              columns={kycColumns}
              data={pendingKycRequests.slice(0, 5) as (PendingKYCRequest & { id: number })[]}
              loading={loading}
              emptyMessage="No pending KYC requests"
              emptyIcon={<FileCheck className="h-10 w-10 text-muted-foreground/50" />}
              mobileCard={renderKycMobileCard}
              onRowClick={() => navigate('/kyc-management')}
            />
            {pendingKycRequests.length > 5 && (
              <div className="mt-3 text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/kyc-management')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All ({pendingKycRequests.length})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-0">
            <PremiumTable
              columns={withdrawalColumns}
              data={pendingWithdrawals.slice(0, 5) as (ShareholderWithdrawal & { id: number })[]}
              loading={loading}
              emptyMessage="No pending withdrawals"
              emptyIcon={<Wallet className="h-10 w-10 text-muted-foreground/50" />}
              mobileCard={renderWithdrawalMobileCard}
              onRowClick={(item) => navigate(`/withdrawals/${item.id}`)}
            />
            {pendingWithdrawals.length > 5 && (
              <div className="mt-3 text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/withdrawals?status=pending')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All ({pendingWithdrawals.length})
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
