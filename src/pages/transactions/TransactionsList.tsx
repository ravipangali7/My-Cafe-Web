import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Receipt, IndianRupee, Filter, Clock, CheckCircle, XCircle, ShoppingCart, CreditCard, Package, MessageCircle, QrCode, Share2, ArrowDownLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { ScrollableStatsCards, PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type TransactionFilterType = 'system' | 'all_users' | 'individual';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { TransactionCategory, TransactionType as TxnType, TRANSACTION_CATEGORY_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/types';

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

interface TransactionStats {
  total: number;
  total_revenue: string;
  pending: number;
  success: number;
  failed: number;
  order: number;
  transaction_fee: number;
  subscription_payments: number;
  whatsapp_usage: number;
  qr_stand_orders: number;
  due_payments: number;
  share_distributions: number;
  shareholder_withdrawals: number;
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
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilterType>('all_users');
  const [appliedTransactionFilter, setAppliedTransactionFilter] = useState<TransactionFilterType>('all_users');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    total_revenue: '0',
    pending: 0,
    success: 0,
    failed: 0,
    order: 0,
    transaction_fee: 0,
    subscription_payments: 0,
    whatsapp_usage: 0,
    qr_stand_orders: 0,
    due_payments: 0,
    share_distributions: 0,
    shareholder_withdrawals: 0,
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
      
      if (user.is_superuser) {
        if (appliedTransactionFilter === 'system') {
          params.is_system = 'true';
        } else if (appliedTransactionFilter === 'all_users') {
          params.is_system = 'false';
        } else if (appliedTransactionFilter === 'individual') {
          params.is_system = 'false';
          if (appliedUserId) {
            params.user_id = appliedUserId;
          }
        }
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
  }, [user, page, pageSize, appliedSearch, appliedUserId, appliedStartDate, appliedEndDate, appliedTransactionFilter]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
      }
      
      const queryString = api.buildQueryString(params);
      const response = await api.get<TransactionStats>(`/api/stats/transactions/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch transaction stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId, appliedStartDate, appliedEndDate]);

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
    setAppliedTransactionFilter(transactionFilter);
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
    setTransactionFilter('all_users');
    setAppliedTransactionFilter('all_users');
    setPage(1);
  };

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    setStartDate(start || '');
    setEndDate(end || '');
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
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

  const getTypeVariant = (type: TxnType): 'success' | 'destructive' => {
    return type === 'in' ? 'success' : 'destructive';
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    return TRANSACTION_CATEGORY_LABELS[category] || category;
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case 'order':
        return ShoppingCart;
      case 'transaction_fee':
        return CreditCard;
      case 'subscription_fee':
        return Package;
      case 'whatsapp_usage':
        return MessageCircle;
      case 'qr_stand_order':
        return QrCode;
      case 'share_distribution':
        return Share2;
      case 'share_withdrawal':
        return ArrowDownLeft;
      case 'due_paid':
        return Wallet;
      default:
        return Receipt;
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: Transaction) => (
        <span className="font-mono font-medium">#{item.id}</span>
      ),
    },
    {
      key: 'type_category',
      label: 'Type',
      render: (item: Transaction) => {
        const CategoryIcon = getCategoryIcon(item.transaction_category);
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge 
              status={TRANSACTION_TYPE_LABELS[item.transaction_type] || item.transaction_type} 
              variant={getTypeVariant(item.transaction_type)} 
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CategoryIcon className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{getCategoryLabel(item.transaction_category)}</span>
            </div>
          </div>
        );
      },
    },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'User',
      hideOnMobile: true,
      render: (item: Transaction) => {
        if (item.is_system) {
          return (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              System
            </Badge>
          );
        }
        if (!item.user_info) return <span className="text-muted-foreground">—</span>;
        return (
          <VendorInfoCell
            name={item.user_info.name}
            phone={item.user_info.phone}
            logoUrl={item.user_info.logo_url}
            size="sm"
          />
        );
      },
    }] : []),
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (item: Transaction) => (
        <span className={`font-semibold ${item.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`}>
          {item.transaction_type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: (item: Transaction) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      hideOnMobile: true,
      render: (item: Transaction) => {
        if (item.order_id) return <span className="text-xs text-muted-foreground">Order #{item.order_id}</span>;
        if (item.qr_stand_order_id) return <span className="text-xs text-muted-foreground">QR #{item.qr_stand_order_id}</span>;
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      hideOnMobile: true,
      render: (item: Transaction) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Stats cards - 12 categories in scrollable container
  const statCards = [
    { label: 'Total Transactions', value: stats.total, icon: Receipt, variant: 'default' as const },
    { label: 'Total Revenue', value: formatCurrency(stats.total_revenue || '0'), icon: IndianRupee, variant: 'highlight' as const },
    { label: 'Pending', value: stats.pending || 0, icon: Clock, variant: 'warning' as const },
    { label: 'Success', value: stats.success || 0, icon: CheckCircle, variant: 'success' as const },
    { label: 'Failed', value: stats.failed || 0, icon: XCircle, variant: 'destructive' as const },
    { label: 'Order', value: stats.order || 0, icon: ShoppingCart, variant: 'info' as const },
    { label: 'Transaction Fee', value: stats.transaction_fee || 0, icon: CreditCard, variant: 'default' as const },
    { label: 'Subscription', value: stats.subscription_payments || 0, icon: Package, variant: 'default' as const },
    { label: 'WhatsApp Usage', value: stats.whatsapp_usage || 0, icon: MessageCircle, variant: 'info' as const },
    { label: 'QR Stand Orders', value: stats.qr_stand_orders || 0, icon: QrCode, variant: 'default' as const },
    { label: 'Due Payments', value: stats.due_payments || 0, icon: Wallet, variant: 'warning' as const },
    { label: 'Share Dist.', value: stats.share_distributions || 0, icon: Share2, variant: 'success' as const },
    { label: 'Withdrawals', value: stats.shareholder_withdrawals || 0, icon: ArrowDownLeft, variant: 'destructive' as const },
  ];

  const renderMobileCard = (transaction: Transaction, index: number) => {
    const CategoryIcon = getCategoryIcon(transaction.transaction_category);
    return (
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-mono text-sm font-medium text-foreground">#{transaction.id}</div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <CategoryIcon className="h-3 w-3" />
              <span>{getCategoryLabel(transaction.transaction_category)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold text-base ${transaction.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`}>
              {transaction.transaction_type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(transaction.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge 
            status={TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type} 
            variant={getTypeVariant(transaction.transaction_type)} 
          />
          <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
          {transaction.is_system && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
              System
            </Badge>
          )}
        </div>

        {(transaction.order_id || transaction.qr_stand_order_id) && (
          <MobileCardRow
            label="Reference"
            value={transaction.order_id ? `Order #${transaction.order_id}` : `QR #${transaction.qr_stand_order_id}`}
            className="mt-1.5"
          />
        )}
        
        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/transactions/${transaction.id}`);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    );
  };

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader title="Transactions" description="View payment transaction history" />

        <ScrollableStatsCards stats={statCards} loading={loadingStats} />
        
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          userId={userId}
          onUserIdChange={setUserId}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          showUserFilter={user?.is_superuser && transactionFilter === 'individual'}
          placeholder="Search transactions..."
          additionalFilters={
            <>
              {user?.is_superuser && (
                <div className="w-full sm:w-40">
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">
                    Type
                  </label>
                  <Select
                    value={transactionFilter}
                    onValueChange={(value: TransactionFilterType) => setTransactionFilter(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system" className="text-xs">System</SelectItem>
                      <SelectItem value="all_users" className="text-xs">All Users</SelectItem>
                      <SelectItem value="individual" className="text-xs">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DateFilterButtons
                activeFilter={dateFilter}
                onFilterChange={handleDateFilterChange}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                compact
              />
            </>
          }
        />

        <PremiumTable
          columns={columns}
          data={transactions}
          loading={loading}
          showSerialNumber={false}
          emptyMessage="No transactions found"
          onRowClick={(item) => navigate(`/transactions/${item.id}`)}
          actions={{
            onView: (item) => navigate(`/transactions/${item.id}`),
          }}
          mobileCard={renderMobileCard}
        />

        {count > pageSize && (
          <div className="mt-4">
            <SimplePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
