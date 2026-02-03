import { SystemBalanceCard } from './SystemBalanceCard';
import { SystemStatsGrid } from './SystemStatsGrid';
import { ShareholderPieChart } from './ShareholderPieChart';
import { RevenueBreakdownChart } from './RevenueBreakdownChart';
import { FinancialTrendsChart } from './FinancialTrendsChart';
import { SystemPendingTables } from './SystemPendingTables';
import { TopVendorsChart } from './TopVendorsChart';
import { SystemDashboardData } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SystemDashboardProps {
  data: SystemDashboardData;
  loading?: boolean;
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground sticky top-14 z-10 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:bg-transparent md:py-0">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SystemDashboard({ data, loading = false }: SystemDashboardProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-8', isMobile && 'space-y-10')}>
      {/* Overview - Balance + Stats */}
      <Section title="Overview">
      <SystemBalanceCard
        balance={data.system_balance}
        loading={loading}
      />
      <SystemStatsGrid data={data} loading={loading} />
      </Section>

      {/* Revenue breakdown - Pie charts */}
      <Section title="Revenue">
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
      <FinancialTrendsChart
        data={data.financial_trends}
        loading={loading}
      />
      </Section>

      {/* Pending */}
      <Section title="Pending">
      <SystemPendingTables
        pendingQrOrders={data.pending_qr_orders}
        pendingKycRequests={data.pending_kyc_requests}
        pendingWithdrawals={data.pending_withdrawals}
        loading={loading}
      />
      </Section>

      {/* Vendors */}
      <Section title="Vendors">
      <TopVendorsChart
        data={data.top_revenue_vendors}
        loading={loading}
      />
      </Section>
    </div>
  );
}
