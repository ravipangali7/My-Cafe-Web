import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/ui/stats-cards';
import { Button } from '@/components/ui/button';
import { ShoppingCart, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VendorDashboardStatsProps {
  totalOrders: number;
  totalSales: string;
  totalRevenue: string;
  financeSummary: {
    today: string;
    week: string;
    month: string;
  };
  loading?: boolean;
}

export function VendorDashboardStats({
  totalOrders,
  totalSales,
  totalRevenue,
  financeSummary,
  loading = false,
}: VendorDashboardStatsProps) {
  const [financePeriod, setFinancePeriod] = useState<'today' | 'week' | 'month'>('today');

  const statsCards = [
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-info',
    },
    {
      label: 'Total Sales',
      value: `₹${parseFloat(totalSales || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      label: 'Total Revenue',
      value: `₹${parseFloat(totalRevenue || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      label: `Finance Summary (${financePeriod === 'today' ? 'Today' : financePeriod === 'week' ? 'This Week' : 'This Month'})`,
      value: `₹${parseFloat(financeSummary[financePeriod] || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: Calendar,
      color: 'text-warning',
    },
  ];

  return (
    <div className="space-y-4">
      <StatsCards stats={statsCards} loading={loading} />
      
      {/* Finance Summary Period Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Finance Summary Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={financePeriod === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFinancePeriod('today')}
              className={cn(
                financePeriod === 'today' && 'bg-primary text-primary-foreground'
              )}
            >
              Today
            </Button>
            <Button
              variant={financePeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFinancePeriod('week')}
              className={cn(
                financePeriod === 'week' && 'bg-primary text-primary-foreground'
              )}
            >
              This Week
            </Button>
            <Button
              variant={financePeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFinancePeriod('month')}
              className={cn(
                financePeriod === 'month' && 'bg-primary text-primary-foreground'
              )}
            >
              This Month
            </Button>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">
              ₹{parseFloat(financeSummary[financePeriod] || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              Revenue for {financePeriod === 'today' ? 'today' : financePeriod === 'week' ? 'this week' : 'this month'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
