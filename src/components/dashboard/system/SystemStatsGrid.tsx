import { useNavigate } from 'react-router-dom';
import { PremiumStatsCards, ScrollableStatsCards, formatCurrency, formatNumber } from '@/components/ui/premium-stats-card';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  Ban,
  DollarSign,
  QrCode,
  CreditCard,
  Receipt,
  MessageSquare,
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  Share2,
} from 'lucide-react';
import { SystemDashboardData } from '@/lib/types';

interface SystemStatsGridProps {
  data: SystemDashboardData;
  loading?: boolean;
}

export function SystemStatsGrid({ data, loading = false }: SystemStatsGridProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Vendor stats
  const vendorStats = [
    {
      label: 'Total Vendors',
      value: formatNumber(data.total_vendors),
      icon: Users,
      variant: 'default' as const,
      onClick: () => navigate('/vendors'),
    },
    {
      label: 'Active Vendors',
      value: formatNumber(data.active_vendors),
      icon: UserCheck,
      variant: 'success' as const,
      onClick: () => navigate('/vendors?is_active=true'),
    },
    {
      label: 'Inactive Vendors',
      value: formatNumber(data.inactive_vendors),
      icon: UserX,
      variant: 'destructive' as const,
      onClick: () => navigate('/vendors?is_active=false'),
    },
    {
      label: 'Pending KYC',
      value: formatNumber(data.pending_kyc_vendors),
      icon: Clock,
      variant: 'warning' as const,
      onClick: () => navigate('/kyc-management'),
    },
    {
      label: 'Expired Vendors',
      value: formatNumber(data.expired_vendors),
      icon: AlertTriangle,
      variant: 'warning' as const,
      onClick: () => navigate('/vendors'),
    },
    {
      label: 'Due Blocked',
      value: formatNumber(data.due_blocked_vendors),
      icon: Ban,
      variant: 'destructive' as const,
      onClick: () => navigate('/dues'),
    },
  ];

  // Shareholder stats
  const shareholderStats = [
    {
      label: 'Total Shareholders',
      value: formatNumber(data.total_shareholders),
      icon: Users,
      variant: 'info' as const,
      onClick: () => navigate('/shareholders'),
    },
    {
      label: 'Shareholder Balance',
      value: formatCurrency(data.total_shareholder_balance),
      icon: Wallet,
      variant: 'success' as const,
      onClick: () => navigate('/shareholders'),
    },
    {
      label: 'Distributed Balance',
      value: formatCurrency(data.total_distributed_balance),
      icon: Share2,
      variant: 'highlight' as const,
      onClick: () => navigate('/shareholders'),
    },
    {
      label: 'Total Withdrawals',
      value: formatCurrency(data.total_shareholder_withdrawals),
      icon: ArrowDownCircle,
      variant: 'default' as const,
      onClick: () => navigate('/withdrawals'),
    },
    {
      label: 'Pending Withdrawals',
      value: formatNumber(data.pending_shareholder_withdrawals_count),
      icon: Clock,
      variant: 'warning' as const,
      onClick: () => navigate('/withdrawals?status=pending'),
    },
  ];

  // Financial stats
  const financialStats = [
    {
      label: 'Total Due Amount',
      value: formatCurrency(data.total_due_amount),
      icon: DollarSign,
      variant: 'warning' as const,
      onClick: () => navigate('/dues'),
    },
    {
      label: 'System Revenue',
      value: formatCurrency(data.total_system_revenue),
      icon: PiggyBank,
      variant: 'success' as const,
      onClick: () => navigate('/transactions?is_system=true'),
    },
    {
      label: 'QR Stand Earnings',
      value: formatCurrency(data.qr_stand_earnings),
      icon: QrCode,
      variant: 'info' as const,
      onClick: () => navigate('/qr-stands'),
    },
    {
      label: 'Subscription Earnings',
      value: formatCurrency(data.subscription_earnings),
      icon: CreditCard,
      variant: 'highlight' as const,
      onClick: () => navigate('/subscription'),
    },
    {
      label: 'Transaction Earnings',
      value: formatCurrency(data.transaction_earnings),
      icon: Receipt,
      variant: 'default' as const,
      onClick: () => navigate('/transactions?is_system=true'),
    },
    {
      label: 'WhatsApp Earnings',
      value: formatCurrency(data.whatsapp_earnings),
      icon: MessageSquare,
      variant: 'success' as const,
      onClick: () => navigate('/whatsapp-notifications'),
    },
  ];

  // Combine all stats for mobile scrollable view
  const allStats = [...vendorStats, ...shareholderStats, ...financialStats];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Scrollable stats on mobile */}
        <ScrollableStatsCards
          stats={allStats}
          loading={loading}
          className="mb-0"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vendor Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Vendor Overview
        </h3>
        <PremiumStatsCards
          stats={vendorStats}
          loading={loading}
          columns={3}
          className="mb-0"
        />
      </div>

      {/* Shareholder Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Shareholders
        </h3>
        <PremiumStatsCards
          stats={shareholderStats}
          loading={loading}
          columns={3}
          className="mb-0"
        />
      </div>

      {/* Financial Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Financial Overview
        </h3>
        <PremiumStatsCards
          stats={financialStats}
          loading={loading}
          columns={3}
          className="mb-0"
        />
      </div>
    </div>
  );
}
