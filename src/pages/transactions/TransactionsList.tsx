import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  amount: string;
  status: string;
  remarks: string | null;
  utr: string | null;
  payer_name: string | null;
  created_at: string;
  order_id: number;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
}

export default function TransactionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    revenue: '0',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      
      if (appliedSearch) {
        params.search = appliedSearch;
      }
      
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }

      const response = await fetchPaginated<Transaction>('/api/transactions/', params);
      
      if (response.error) {
        toast.error('Failed to fetch transactions');
      } else if (response.data) {
        setTransactions(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch, appliedUserId]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      
      const queryString = api.buildQueryString(params);
      const response = await api.get<{
        total: number;
        revenue: string;
      }>(`/api/stats/transactions/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch transaction stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchStats();
    }
  }, [user, fetchTransactions, fetchStats]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedUserId(userId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setUserId(null);
    setAppliedUserId(null);
    setPage(1);
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (item: Transaction) => `#${item.id}`,
    },
    {
      key: 'order_id',
      label: 'Order ID',
      render: (item: Transaction) => `#${item.order_id}`,
    },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'User',
      render: (item: Transaction) => {
        if (!item.user_info) return '—';
        return (
          <div className="flex items-center gap-2">
            {item.user_info.logo_url ? (
              <img 
                src={item.user_info.logo_url} 
                alt={item.user_info.name} 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs">
                {item.user_info.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">{item.user_info.name}</div>
              <div className="text-xs text-muted-foreground">{item.user_info.phone}</div>
            </div>
          </div>
        );
      },
    }] : []),
    {
      key: 'amount',
      label: 'Amount',
      render: (item: Transaction) => `₹${Number(item.amount).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Transaction) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'payer_name',
      label: 'Payer',
      render: (item: Transaction) => item.payer_name || '—',
    },
    {
      key: 'utr',
      label: 'UTR',
      render: (item: Transaction) => item.utr || '—',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: Transaction) => new Date(item.created_at).toLocaleString(),
    },
  ];

  const statCards = [
    { label: 'Total Transactions', value: stats.total, icon: Receipt, color: 'text-foreground' },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.revenue || '0').toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Transactions" description="View payment transaction history" />

      <StatsCards stats={statCards} loading={loadingStats} />
      
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        userId={userId}
        onUserIdChange={setUserId}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        showUserFilter={user?.is_superuser}
      />

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found</div>
          ) : (
            transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-base">Transaction #{transaction.id}</div>
                      {transaction.order_id && (
                        <div className="text-sm text-muted-foreground">Order #{transaction.order_id}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-base">₹{Number(transaction.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
                    {transaction.payer_name && (
                      <span className="text-sm text-muted-foreground">Payer: {transaction.payer_name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={transactions} 
          loading={loading} 
          emptyMessage="No transactions found"
          onRowClick={(item) => navigate(`/transactions/${item.id}`)}
        />
      )}

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
