import { Link } from 'react-router-dom';
import { VendorStatsCards } from './VendorStatsCards';
import { RevenueFlowChart } from './RevenueFlowChart';
import { ProductInsightsSection } from './ProductInsightsSection';
import { RepeatCustomersTable } from './RepeatCustomersTable';
import { TransactionHistoryTable } from '../TransactionHistoryTable';
import { VendorDashboardData } from '@/lib/types';
import { useVendor } from '@/contexts/VendorContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store } from 'lucide-react';

const DASHBOARD_TABLE_LIMIT = 5;

interface VendorDashboardProps {
  data: VendorDashboardData;
  vendorPhone?: string;
  loading?: boolean;
}

function Section({ title, children, className, viewAllHref }: { title: string; children: React.ReactNode; className?: string; viewAllHref?: string }) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground sticky top-14 z-10 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:bg-transparent md:py-0">
          {title}
        </h2>
        {viewAllHref && (
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link to={viewAllHref}>
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>
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
  const { vendor } = useVendor();

  return (
    <div className={cn('space-y-8', isMobile && 'space-y-10')}>
      {/* Vendor greeting - logo and name */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
        {vendor?.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={vendor.name}
            className="h-14 w-14 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
            <Store className="h-7 w-7 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Hello, {vendor?.name || 'Vendor'}!
          </h1>
          <p className="text-sm text-muted-foreground">Here’s your dashboard overview.</p>
        </div>
      </div>

      {/* Overview - Stats */}
      <Section title="Overview">
        <VendorStatsCards
        dueBalance={data.due_balance}
        subscriptionStatus={data.subscription_status}
        pendingOrdersCount={data.pending_orders_count}
        pendingQrOrdersCount={data.pending_qr_orders_count}
        totalOrders={data.total_orders}
        totalSales={data.total_sales}
        totalProducts={data.total_products}
        totalQrStandOrders={data.total_qr_stand_orders}
        vendorPhone={vendorPhone}
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

      {/* Products - first 5 */}
      <Section title="Products" viewAllHref="/products">
      <ProductInsightsSection
        topSellingProducts={data.top_selling_products.slice(0, DASHBOARD_TABLE_LIMIT)}
        topRevenueProducts={data.top_revenue_products.slice(0, DASHBOARD_TABLE_LIMIT)}
        loading={loading}
      />
      </Section>

      {/* Customers - first 5 */}
      <Section title="Customers" viewAllHref="/customers">
      <RepeatCustomersTable
        customers={data.repeat_customers.slice(0, DASHBOARD_TABLE_LIMIT)}
        loading={loading}
      />
      </Section>

      {/* Transactions - first 5 */}
      <Section title="Transactions" viewAllHref="/transactions">
      <TransactionHistoryTable
        transactions={data.transactions.slice(0, DASHBOARD_TABLE_LIMIT)}
        loading={loading}
      />
      </Section>
    </div>
  );
}
