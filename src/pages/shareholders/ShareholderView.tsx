import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Phone, Percent, Wallet, ArrowDownLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PremiumStatsCard, formatCurrency } from '@/components/ui/premium-stats-card';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shareholder, ShareholderWithdrawal, Transaction, TRANSACTION_CATEGORY_LABELS } from '@/lib/types';

interface ShareholderDetail extends Shareholder {
  total_withdrawal: number;
  remaining_distribution: number;
  withdrawals?: ShareholderWithdrawal[];
  transactions?: Transaction[];
}

export default function ShareholderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareholder, setShareholder] = useState<ShareholderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShareholder = useCallback(async () => {
    if (!id || !user?.is_superuser) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<{ shareholder: ShareholderDetail }>(`/api/shareholders/${id}/`);

      if (response.error || !response.data) {
        toast.error('Shareholder not found');
        navigate('/shareholders');
        return;
      }

      setShareholder(response.data.shareholder);
    } catch (error) {
      toast.error('Failed to fetch shareholder');
      navigate('/shareholders');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    fetchShareholder();
  }, [fetchShareholder]);

  const getWithdrawalStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (!user?.is_superuser) {
    return (
      <DashboardLayout>
        <PageHeader title="Access Denied" backLink="/shareholders" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Only super admins can view shareholder details.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading || !shareholder) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/shareholders" />
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const withdrawalColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: ShareholderWithdrawal) => `#${item.id}`,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: ShareholderWithdrawal) => (
        <span className="font-semibold">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ShareholderWithdrawal) => (
        <StatusBadge status={item.status} variant={getWithdrawalStatusVariant(item.status)} />
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (item: ShareholderWithdrawal) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const transactionColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: Transaction) => `#${item.id}`,
    },
    {
      key: 'category',
      label: 'Category',
      render: (item: Transaction) => (
        <span className="text-xs">{TRANSACTION_CATEGORY_LABELS[item.transaction_category]}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: Transaction) => (
        <span className={`font-semibold ${item.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`}>
          {item.transaction_type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Transaction) => (
        <StatusBadge status={item.status} variant={item.status === 'success' ? 'success' : item.status === 'pending' ? 'warning' : 'destructive'} />
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (item: Transaction) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title={shareholder.name}
          backLink="/shareholders"
          action={
            <Button variant="outline" onClick={() => navigate(`/shareholders/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Shareholder Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={shareholder.logo_url || undefined} alt={shareholder.name} />
                  <AvatarFallback className="text-3xl font-semibold bg-accent">
                    {shareholder.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <span>{shareholder.phone}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{shareholder.name}</h2>
                  {shareholder.address && (
                    <p className="text-sm text-muted-foreground mt-1">{shareholder.address}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-step Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Shareholder Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-3 rounded-lg bg-accent/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm font-semibold mt-1">{shareholder.phone}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                  <p className="text-sm font-semibold mt-1 truncate">{shareholder.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Percentage</p>
                  <p className="text-sm font-bold text-success mt-1">{shareholder.share_percentage}%</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
                  <p className="text-sm font-semibold mt-1">{formatCurrency(shareholder.balance)}</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Withdrawal</p>
                  <p className="text-sm font-semibold mt-1">{formatCurrency(shareholder.total_withdrawal || 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining Dist.</p>
                  <p className="text-sm font-semibold mt-1">{formatCurrency(shareholder.remaining_distribution || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <PremiumStatsCard
              label="Total Withdrawals"
              value={formatCurrency(shareholder.total_withdrawal || 0)}
              icon={ArrowDownLeft}
              variant="warning"
            />
            <PremiumStatsCard
              label="Share Distributions"
              value={formatCurrency(shareholder.remaining_distribution || 0)}
              icon={Share2}
              variant="success"
            />
          </div>

          {/* Withdrawal History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Withdrawal History
              </CardTitle>
              <CardDescription>Recent withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {shareholder.withdrawals && shareholder.withdrawals.length > 0 ? (
                <PremiumTable
                  columns={withdrawalColumns}
                  data={shareholder.withdrawals}
                  loading={false}
                  emptyMessage="No withdrawals found"
                  onRowClick={(item) => navigate(`/withdrawals/${item.id}`)}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawal history
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Share distribution transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {shareholder.transactions && shareholder.transactions.length > 0 ? (
                <PremiumTable
                  columns={transactionColumns}
                  data={shareholder.transactions}
                  loading={false}
                  emptyMessage="No transactions found"
                  onRowClick={(item) => navigate(`/transactions/${item.id}`)}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transaction history
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
