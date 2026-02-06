import { Link } from 'react-router-dom';
import { VendorStatsCards } from './VendorStatsCards';
import { RevenueFlowChart } from './RevenueFlowChart';
import { ProductInsightsSection } from './ProductInsightsSection';
import { RepeatCustomersTable } from './RepeatCustomersTable';
import { TransactionHistoryTable } from '../TransactionHistoryTable';
import { VendorDashboardData } from '@/lib/types';
import { useVendor } from '@/contexts/VendorContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store } from 'lucide-react';
import { VendorOnlineToggle } from './VendorOnlineToggle';

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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground sticky top-20 md:top-14 z-10 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:bg-transparent md:py-0">
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
  const { vendor, refetch, loading: vendorLoading } = useVendor();

  return (
    <div className={cn('space-y-8', isMobile && 'space-y-10')}>
      {/* Vendor greeting - logo, name; Online/Offline toggle only on desktop (mobile uses header toggle) */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-card border border-border">
        {vendor?.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={vendor.name}
            className="h-14 w-14 rounded-full object-cover border-2 border-border flex-shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0">
            <Store className="h-7 w-7 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            Hello, {vendor?.name || 'Vendor'}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMobile ? 'Your dashboard overview.' : "Here's your dashboard overview."}
          </p>
        </div>
        {vendor && !isMobile && (
          <VendorOnlineToggle
            isOnline={vendor.is_online !== false}
            onToggle={async (next) => {
              const res = await api.put<{ user?: unknown }>('/api/auth/user/update/', { is_online: next });
              if (res.error) {
                toast.error(res.error);
                throw new Error(res.error);
              }
              await refetch();
            }}
            disabled={vendorLoading}
          />
        )}
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
