import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Transaction as TransactionType, TransactionCategory, TransactionType as TxnType, TRANSACTION_CATEGORY_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/types';

interface Transaction {
  id: number;
  amount: string;
  status: string;
  remarks: string | null;
  utr: string | null;
  payer_name: string | null;
  created_at: string;
  order_id: number | null;
  qr_stand_order_id: number | null;
  transaction_type: TxnType;
  transaction_category: TransactionCategory;
  is_system: boolean;
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
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
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
      
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
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
  }, [user, page, pageSize, appliedSearch, appliedUserId, appliedStartDate, appliedEndDate]);

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
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setUserId(null);
    setAppliedUserId(null);
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    setStartDate(start || '');
    setEndDate(end || '');
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

  const getTypeVariant = (type: TxnType) => {
    return type === 'in' ? 'success' : 'destructive';
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    return TRANSACTION_CATEGORY_LABELS[category] || category;
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: Transaction) => `#${item.id}`,
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (item: Transaction) => (
        <StatusBadge 
          status={TRANSACTION_TYPE_LABELS[item.transaction_type] || item.transaction_type} 
          variant={getTypeVariant(item.transaction_type)} 
        />
      ),
    },
    {
      key: 'transaction_category',
      label: 'Category',
      render: (item: Transaction) => (
        <span className="text-xs bg-accent px-2 py-1 rounded">
          {getCategoryLabel(item.transaction_category)}
        </span>
      ),
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
      render: (item: Transaction) => (
        <span className={item.transaction_type === 'in' ? 'text-green-600' : 'text-red-600'}>
          {item.transaction_type === 'in' ? '+' : '-'}₹{Number(item.amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Transaction) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'is_system',
      label: 'System',
      render: (item: Transaction) => item.is_system ? (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">System</span>
      ) : '—',
    },
    {
      key: 'order_id',
      label: 'Reference',
      render: (item: Transaction) => {
        if (item.order_id) return `Order #${item.order_id}`;
        if (item.qr_stand_order_id) return `QR #${item.qr_stand_order_id}`;
        return '—';
      },
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

  const selectedTransaction = selectedTransactionId ? transactions.find((t) => t.id === selectedTransactionId) : null;

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
        additionalFilters={
          <div className="w-full">
            <DateFilterButtons
              activeFilter={dateFilter}
              onFilterChange={handleDateFilterChange}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        }
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
                onClick={() => setSelectedTransactionId(transaction.id)}
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

      {selectedTransaction && (
        <Dialog open={!!selectedTransactionId} onOpenChange={(open) => !open && setSelectedTransactionId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transaction #{selectedTransaction.id}</DialogTitle>
              <DialogDescription>
                ₹{Number(selectedTransaction.amount).toFixed(2)} • {new Date(selectedTransaction.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTransactionId(null);
                  navigate(`/transactions/${selectedTransaction.id}`);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
