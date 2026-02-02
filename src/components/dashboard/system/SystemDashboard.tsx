import { SystemBalanceCard } from './SystemBalanceCard';
import { SystemStatsGrid } from './SystemStatsGrid';
import { ShareholderPieChart } from './ShareholderPieChart';
import { RevenueBreakdownChart } from './RevenueBreakdownChart';
import { FinancialTrendsChart } from './FinancialTrendsChart';
import { SystemPendingTables } from './SystemPendingTables';
import { TopVendorsChart } from './TopVendorsChart';
import { SystemDashboardData } from '@/lib/types';

interface SystemDashboardProps {
  data: SystemDashboardData;
  loading?: boolean;
}

export function SystemDashboard({ data, loading = false }: SystemDashboardProps) {
  return (
    <div className="space-y-6">
      {/* System Balance Card (Prominent) */}
      <SystemBalanceCard
        balance={data.system_balance}
        loading={loading}
      />

      {/* Stats Grid (17 cards) */}
      <SystemStatsGrid data={data} loading={loading} />

      {/* Pie Charts Section (Two-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShareholderPieChart
          data={data.shareholder_distribution}
          loading={loading}
        />
        <RevenueBreakdownChart
          data={data.revenue_breakdown}
          loading={loading}
        />
      </div>

      {/* Financial Trends Line Chart */}
      <FinancialTrendsChart
        data={data.financial_trends}
        loading={loading}
      />

      {/* Pending Tables Section (Tabbed) */}
      <SystemPendingTables
        pendingQrOrders={data.pending_qr_orders}
        pendingKycRequests={data.pending_kyc_requests}
        pendingWithdrawals={data.pending_withdrawals}
        loading={loading}
      />

      {/* Top Revenue Vendors Bar Chart */}
      <TopVendorsChart
        data={data.top_revenue_vendors}
        loading={loading}
      />
    </div>
  );
}
