import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SharePieChartProps {
  distributedPercentage: number;
  distributedAmount: number;
  remainingPercentage: number;
  remainingAmount: number;
  className?: string;
  title?: string;
  showLegend?: boolean;
}

const COLORS = {
  distributed: 'hsl(var(--success))',
  remaining: 'hsl(var(--muted))',
};

export function SharePieChart({
  distributedPercentage,
  distributedAmount,
  remainingPercentage,
  remainingAmount,
  className,
  title = 'Share Distribution',
  showLegend = true,
}: SharePieChartProps) {
  const data = [
    {
      name: 'Distributed',
      value: distributedPercentage,
      amount: distributedAmount,
      color: COLORS.distributed,
    },
    {
      name: 'Remaining',
      value: remainingPercentage,
      amount: remainingAmount,
      color: COLORS.remaining,
    },
  ];

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value}% ({formatCurrency(data.amount)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {showLegend && (
          <div className="mt-4 space-y-2">
            {data.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-foreground">{item.value}%</span>
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency(item.amount)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact donut chart for inline use
export function ShareDonutMini({
  percentage,
  size = 40,
  strokeWidth = 4,
  className,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-xs font-medium text-foreground">
        {percentage}%
      </span>
    </div>
  );
}

// Stats card with donut chart
export function ShareDistributionCard({
  distributedPercentage,
  distributedAmount,
  remainingPercentage,
  remainingAmount,
  totalAmount,
  className,
}: {
  distributedPercentage: number;
  distributedAmount: number;
  remainingPercentage: number;
  remainingAmount: number;
  totalAmount: number;
  className?: string;
}) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <ShareDonutMini percentage={distributedPercentage} size={60} strokeWidth={6} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Share Distribution</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <p className="text-xs text-muted-foreground">Distributed</p>
            <p className="text-sm font-semibold text-success">
              {distributedPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(distributedAmount)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-sm font-semibold text-foreground">
              {remainingPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
