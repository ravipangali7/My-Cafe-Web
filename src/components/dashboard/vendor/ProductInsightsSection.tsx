import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductInsight } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { TrendingUp, DollarSign, Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMediaProxyUrl } from '@/lib/api';
import { chartColors } from '@/lib/theme';

interface ProductInsightsSectionProps {
  topSellingProducts: ProductInsight[];
  topRevenueProducts: ProductInsight[];
  loading?: boolean;
}

export function ProductInsightsSection({
  topSellingProducts,
  topRevenueProducts,
  loading = false,
}: ProductInsightsSectionProps) {
  const isMobile = useIsMobile();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label, isRevenue }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1 truncate max-w-[200px]">
            {label}
          </p>
          <p className="text-sm text-muted-foreground">
            {isRevenue 
              ? `Revenue: ${formatCurrency(payload[0].value)}`
              : `Quantity: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data with truncated names
  const prepareChartData = (products: ProductInsight[], key: 'total_quantity' | 'total_revenue') => {
    return products.slice(0, 10).map((item) => ({
      name: truncateName(item.product_name, isMobile ? 8 : 15),
      fullName: item.product_name,
      value: key === 'total_revenue' ? item.total_revenue : item.total_quantity,
      image: item.product_image,
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductInsightSkeleton />
        <ProductInsightSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Selling Products (by quantity) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" style={{ color: chartColors[1] }} />
            Top Selling Products
          </CardTitle>
          <CardDescription>By quantity sold</CardDescription>
        </CardHeader>
        <CardContent>
          {topSellingProducts.length > 0 ? (
            isMobile ? (
              <ProductList products={topSellingProducts} valueKey="quantity" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareChartData(topSellingProducts, 'total_quantity')}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={(props) => <CustomTooltip {...props} isRevenue={false} />} />
                  <Bar
                    dataKey="value"
                    fill={chartColors[1]}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <EmptyState message="No product data available" />
          )}
        </CardContent>
      </Card>

      {/* Top Revenue Products (by amount) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: chartColors[0] }} />
            Top Revenue Products
          </CardTitle>
          <CardDescription>By total revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {topRevenueProducts.length > 0 ? (
            isMobile ? (
              <ProductList products={topRevenueProducts} valueKey="revenue" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareChartData(topRevenueProducts, 'total_revenue')}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={(props) => <CustomTooltip {...props} isRevenue={true} />} />
                  <Bar
                    dataKey="value"
                    fill={chartColors[0]}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <EmptyState message="No revenue data available" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Product list for mobile view
function ProductList({
  products,
  valueKey,
}: {
  products: ProductInsight[];
  valueKey: 'quantity' | 'revenue';
}) {
  return (
    <div className="space-y-3">
      {products.slice(0, 5).map((product, index) => (
        <div
          key={product.product_id}
          className="flex items-center gap-3 p-2 rounded-lg bg-accent/30"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium">
            {index + 1}
          </span>
          <Avatar className="h-10 w-10">
            {product.product_image ? (
              <AvatarImage src={getMediaProxyUrl(product.product_image)} alt={product.product_name} />
            ) : null}
            <AvatarFallback className="bg-accent text-xs">
              {product.product_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{product.product_name}</p>
            <p className="text-xs text-muted-foreground">
              {valueKey === 'quantity'
                ? `${product.total_quantity} sold`
                : formatCurrency(product.total_revenue)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">
              {valueKey === 'quantity'
                ? product.total_quantity
                : formatCurrency(product.total_revenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
      <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Loading skeleton
function ProductInsightSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Truncate name helper
function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '...';
}

// Format large numbers compactly
function formatCompactNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
