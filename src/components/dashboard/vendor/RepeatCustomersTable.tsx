import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PremiumTable,
  MobileCardHeader,
  MobileCardContent,
  MobileCardRow,
} from '@/components/ui/premium-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RepeatCustomer } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { Users, Phone, ShoppingBag, Wallet } from 'lucide-react';

interface RepeatCustomersTableProps {
  customers: RepeatCustomer[];
  loading?: boolean;
}

export function RepeatCustomersTable({
  customers,
  loading = false,
}: RepeatCustomersTableProps) {
  // Table columns
  const columns = [
    {
      key: 'rank',
      label: '#',
      className: 'w-12',
      render: (_: RepeatCustomer, index: number) => (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Customer',
      render: (item: RepeatCustomer) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{item.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {item.country_code}{item.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'order_count',
      label: 'Orders',
      align: 'center' as const,
      render: (item: RepeatCustomer) => (
        <div className="flex items-center justify-center gap-1">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{item.order_count}</span>
        </div>
      ),
    },
    {
      key: 'total_spend',
      label: 'Total Spend',
      align: 'right' as const,
      render: (item: RepeatCustomer) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(item.total_spend)}
        </span>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (item: RepeatCustomer, index: number) => (
    <>
      <MobileCardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {index + 1}
          </span>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-accent text-xs">
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{item.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {item.country_code}{item.phone}
            </p>
          </div>
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow
          label="Orders"
          value={
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              {item.order_count}
            </span>
          }
        />
        <MobileCardRow
          label="Total Spend"
          value={
            <span className="font-semibold text-green-600">
              {formatCurrency(item.total_spend)}
            </span>
          }
        />
      </MobileCardContent>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          Most Repeating Customers
        </CardTitle>
        <CardDescription>
          Customers who order frequently from your cafe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PremiumTable
          columns={columns}
          data={customers.slice(0, 10) as (RepeatCustomer & { id: number })[]}
          loading={loading}
          emptyMessage="No repeat customers yet"
          emptyIcon={<Users className="h-12 w-12 text-muted-foreground/50" />}
          mobileCard={renderMobileCard}
        />
      </CardContent>
    </Card>
  );
}

// Get initials from name
function getInitials(name: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
