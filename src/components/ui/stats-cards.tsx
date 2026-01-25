import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

interface StatsCardsProps {
  stats: StatCard[];
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color || 'text-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? '—' : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
