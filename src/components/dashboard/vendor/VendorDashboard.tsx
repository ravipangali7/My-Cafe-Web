import { VendorStatsCards } from './VendorStatsCards';
import { PendingOrdersSection } from './PendingOrdersSection';
import { RevenueFlowChart } from './RevenueFlowChart';
import { ProductInsightsSection } from './ProductInsightsSection';
import { RepeatCustomersTable } from './RepeatCustomersTable';
import { TransactionHistoryTable } from '../TransactionHistoryTable';
import { VendorDashboardData } from '@/lib/types';

interface VendorDashboardProps {
  data: VendorDashboardData;
  vendorPhone?: string;
  loading?: boolean;
}

export function VendorDashboard({
  data,
  vendorPhone,
  loading = false,
}: VendorDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards Section */}
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

      {/* Pending Orders Section (Two-column) */}
      <PendingOrdersSection
        pendingOrders={data.pending_orders}
        pendingQrOrders={data.pending_qr_orders}
        loading={loading}
      />

      {/* Revenue Flow Chart */}
      <RevenueFlowChart
        data={data.revenue_trends}
        loading={loading}
      />

      {/* Product Insights Section (Two-column) */}
      <ProductInsightsSection
        topSellingProducts={data.top_selling_products}
        topRevenueProducts={data.top_revenue_products}
        loading={loading}
      />

      {/* Most Repeating Customers Table */}
      <RepeatCustomersTable
        customers={data.repeat_customers}
        loading={loading}
      />

      {/* Transaction History Table */}
      <TransactionHistoryTable
        transactions={data.transactions}
        loading={loading}
      />
    </div>
  );
}
