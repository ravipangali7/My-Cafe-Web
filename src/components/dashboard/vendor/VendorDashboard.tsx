import { VendorStatsCards } from './VendorStatsCards';
import { PendingOrdersSection } from './PendingOrdersSection';
import { RevenueFlowChart } from './RevenueFlowChart';
import { ProductInsightsSection } from './ProductInsightsSection';
import { RepeatCustomersTable } from './RepeatCustomersTable';
import { TransactionHistoryTable } from '../TransactionHistoryTable';
import { VendorDashboardData } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface VendorDashboardProps {
  data: VendorDashboardData;
  vendorPhone?: string;
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

export function VendorDashboard({
  data,
  vendorPhone,
  loading = false,
}: VendorDashboardProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-8', isMobile && 'space-y-10')}>
      {/* Overview - Stats */}
      <Section title="Overview">
        <VendorStatsCards
        dueBalance={data.due_balance}
        subscriptionStatus={data.subscription_status}
        totalOrders={data.total_orders}
        totalSales={data.total_sales}
        totalProducts={data.total_products}
        totalQrStandOrders={data.total_qr_stand_orders}
        vendorPhone={vendorPhone}
        loading={loading}
        />
      </Section>

      {/* Pending Orders */}
      <Section title="Orders">
      <PendingOrdersSection
        pendingOrders={data.pending_orders}
        pendingQrOrders={data.pending_qr_orders}
        loading={loading}
      />
      </Section>

      {/* Revenue */}
      <Section title="Revenue">
      <RevenueFlowChart
        data={data.revenue_trends}
        loading={loading}
      />
      </Section>

      {/* Products */}
      <Section title="Products">
      <ProductInsightsSection
        topSellingProducts={data.top_selling_products}
        topRevenueProducts={data.top_revenue_products}
        loading={loading}
      />
      </Section>

      {/* Customers */}
      <Section title="Customers">
      <RepeatCustomersTable
        customers={data.repeat_customers}
        loading={loading}
      />
      </Section>

      {/* Transactions */}
      <Section title="Transactions">
      <TransactionHistoryTable
        transactions={data.transactions}
        loading={loading}
      />
      </Section>
    </div>
  );
}
