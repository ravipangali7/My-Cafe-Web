import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartEmptyState } from '../shared/ChartCard';
import { TopVendor } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { getMediaProxyUrl } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { barChartShades } from '@/lib/theme';
import { TrendingUp, Trophy, Store } from 'lucide-react';

interface TopVendorsChartProps {
  data: TopVendor[];
  loading?: boolean;
}

export function TopVendorsChart({ data, loading = false }: TopVendorsChartProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Prepare chart data
  const chartData = data.slice(0, 10).map((item, index) => ({
    ...item,
    shortName: truncateName(item.name, isMobile ? 10 : 15),
    color: barChartShades[index],
    rank: index + 1,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              {item.logo_url ? (
                <AvatarImage src={getMediaProxyUrl(item.logo_url)} />
              ) : null}
              <AvatarFallback className="text-xs">
                {item.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.phone}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Revenue:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(item.total_revenue)}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Orders:</span>
              <span className="font-medium">{item.total_orders}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32 mt-1" />
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
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Revenue Vendors
        </CardTitle>
        <CardDescription>Vendors with highest total revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Chart for desktop */}
            {!isMobile && (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
                    dataKey="shortName"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total_revenue"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={35}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* List view (always shown on mobile, optional on desktop) */}
            <div className={isMobile ? 'space-y-2' : 'hidden'}>
              {chartData.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: vendor.color }}
                  >
                    {vendor.rank}
                  </span>
                  <Avatar className="h-10 w-10">
                    {vendor.logo_url ? (
                      <AvatarImage src={getMediaProxyUrl(vendor.logo_url)} />
                    ) : null}
                    <AvatarFallback className="bg-accent">
                      <Store className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.total_orders} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">
                      {formatCurrency(vendor.total_revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ChartEmptyState message="No vendor data available" />
        )}
      </CardContent>
    </Card>
  );
}

// Truncate name helper
function truncateName(name: string, maxLength: number): string {
  if (!name) return 'Unknown';
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
