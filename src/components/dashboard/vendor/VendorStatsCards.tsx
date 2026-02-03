import { useNavigate } from 'react-router-dom';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import {
  Wallet,
  CreditCard,
  QrCode,
  ShoppingCart,
  DollarSign,
  Package,
  Layers,
  Clock,
  ScanLine,
} from 'lucide-react';

interface VendorStatsCardsProps {
  dueBalance: number;
  subscriptionStatus: 'active' | 'expired' | 'none';
  pendingOrdersCount: number;
  pendingQrOrdersCount: number;
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  totalQrStandOrders: number;
  vendorPhone?: string;
  loading?: boolean;
}

export function VendorStatsCards({
  dueBalance,
  subscriptionStatus,
  pendingOrdersCount,
  pendingQrOrdersCount,
  totalOrders,
  totalSales,
  totalProducts,
  totalQrStandOrders,
  vendorPhone,
  loading = false,
}: VendorStatsCardsProps) {
  const navigate = useNavigate();

  const getSubscriptionVariant = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'success';
      case 'expired':
        return 'destructive';
      default:
        return 'warning';
    }
  };

  const getSubscriptionLabel = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      default:
        return 'None';
    }
  };

  const stats = [
    {
      label: 'Due Balance',
      value: formatCurrency(dueBalance),
      icon: Wallet,
      variant: dueBalance > 0 ? 'warning' as const : 'success' as const,
      onClick: dueBalance > 0 ? () => navigate('/pay-dues') : undefined,
    },
    {
      label: 'Subscription',
      value: getSubscriptionLabel(),
      icon: CreditCard,
      variant: getSubscriptionVariant() as 'success' | 'destructive' | 'warning',
      onClick: () => navigate('/subscription'),
    },
    {
      label: 'Menu QR Code',
      value: 'View',
      icon: QrCode,
      variant: 'highlight' as const,
      onClick: vendorPhone ? () => navigate(`/qr/${vendorPhone}`) : undefined,
    },
    {
      label: 'Pending Orders',
      value: pendingOrdersCount.toLocaleString(),
      icon: Clock,
      variant: pendingOrdersCount > 0 ? ('warning' as const) : ('default' as const),
      onClick: () => navigate('/orders?status=pending'),
    },
    {
      label: 'Pending QR Stand',
      value: pendingQrOrdersCount.toLocaleString(),
      icon: ScanLine,
      variant: pendingQrOrdersCount > 0 ? ('warning' as const) : ('default' as const),
      onClick: () => navigate('/qr-stands?order_status=pending'),
    },
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      variant: 'default' as const,
      onClick: () => navigate('/orders'),
    },
    {
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      icon: DollarSign,
      variant: 'success' as const,
    },
    {
      label: 'Total Products',
      value: totalProducts.toLocaleString(),
      icon: Package,
      variant: 'info' as const,
      onClick: () => navigate('/products'),
    },
    {
      label: 'QR Stand Orders',
      value: totalQrStandOrders.toLocaleString(),
      icon: Layers,
      variant: 'default' as const,
      onClick: () => navigate('/qr-stands'),
    },
  ];

  return (
    <PremiumStatsCards
      stats={stats}
      loading={loading}
      columns={4}
      className="mb-0"
    />
  );
}
