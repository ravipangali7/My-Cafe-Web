import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Wallet, Users, IndianRupee, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VendorDue } from '@/lib/types';

interface DueStats {
  total_dues: number;
  total_due_amount: number;
  over_threshold_dues: number;
  over_threshold_amount: number;
  outstanding_dues: number;
  outstanding_amount: number;
}

export default function DuesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [overThresholdOnly, setOverThresholdOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<DueStats>({
    total_dues: 0,
    total_due_amount: 0,
    over_threshold_dues: 0,
    over_threshold_amount: 0,
    outstanding_dues: 0,
    outstanding_amount: 0,
  });
  const [dueThreshold, setDueThreshold] = useState(1000);

  const fetchDues = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
      };

      if (appliedSearch) params.search = appliedSearch;
      if (overThresholdOnly) params.over_threshold = 'true';

      const queryString = api.buildQueryString(params);
      const response = await api.get<{
        vendors: VendorDue[];
        count: number;
        total_pages: number;
        total_dues: number;
        due_threshold: number;
        over_threshold_count: number;
      }>(`/api/dues/${queryString}`);

      if (response.error) {
        toast.error('Failed to fetch dues');
      } else if (response.data) {
        setVendors(response.data.vendors);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        setDueThreshold(response.data.due_threshold);
        
        // Calculate stats from vendors
        const totalDueAmount = response.data.vendors.reduce((sum, v) => sum + v.due_balance, 0);
        const overThresholdVendors = response.data.vendors.filter(v => v.is_over_threshold);
        const overThresholdAmount = overThresholdVendors.reduce((sum, v) => sum + v.due_balance, 0);
        
        setStats({
          total_dues: response.data.count,
          total_due_amount: response.data.total_dues || totalDueAmount,
          over_threshold_dues: response.data.over_threshold_count,
          over_threshold_amount: overThresholdAmount,
          outstanding_dues: response.data.count,
          outstanding_amount: response.data.total_dues || totalDueAmount,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch dues');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedSearch, overThresholdOnly]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setOverThresholdOnly(false);
    setPage(1);
  };

  const columns = [
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: VendorDue) => (
        <VendorInfoCell
          name={item.name}
          phone={item.phone}
          logoUrl={item.logo_url}
          size="md"
        />
      ),
    },
    {
      key: 'due_balance',
      label: 'Due Amount',
      align: 'right' as const,
      render: (item: VendorDue) => (
        <div className="flex items-center justify-end gap-2">
          <span className={`font-semibold ${item.is_over_threshold ? 'text-destructive' : ''}`}>
            {formatCurrency(item.due_balance)}
          </span>
          {item.is_over_threshold && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right' as const,
      hideOnMobile: true,
      render: (item: VendorDue) => (
        <span className="text-muted-foreground">{formatCurrency(item.balance)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: (item: VendorDue) => item.is_over_threshold ? (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          Over Threshold
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          Outstanding
        </Badge>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Dues', value: stats.total_dues, icon: Users, variant: 'default' as const },
    { label: 'Total Due Amount', value: formatCurrency(stats.total_due_amount), icon: IndianRupee, variant: 'highlight' as const },
    { label: 'Over-Threshold Dues', value: stats.over_threshold_dues, icon: AlertTriangle, variant: 'destructive' as const },
    { label: 'Over-Threshold Amount', value: formatCurrency(stats.over_threshold_amount), icon: IndianRupee, variant: 'destructive' as const },
    { label: 'Outstanding Dues', value: stats.outstanding_dues, icon: AlertCircle, variant: 'warning' as const },
    { label: 'Outstanding Amount', value: formatCurrency(stats.outstanding_amount), icon: Wallet, variant: 'warning' as const },
  ];

  const renderMobileCard = (vendor: VendorDue, index: number) => (
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <VendorInfoCell
          name={vendor.name}
          phone={vendor.phone}
          logoUrl={vendor.logo_url}
          size="md"
        />
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold ${vendor.is_over_threshold ? 'text-destructive' : 'text-foreground'}`}>
            {formatCurrency(vendor.due_balance)}
          </p>
          {vendor.is_over_threshold && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs mt-1">
              Over Threshold
            </Badge>
          )}
        </div>
      </div>

      <MobileCardRow
        label="Balance"
        value={formatCurrency(vendor.balance)}
        className="mt-3"
      />
      
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dues/${vendor.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    </CardContent>
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader 
          title="Dues" 
          description={`Manage vendor dues (Threshold: ${formatCurrency(dueThreshold)})`}
        />

        <PremiumStatsCards stats={statCards} loading={loading} columns={3} />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          additionalFilters={
            <Button
              variant={overThresholdOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setOverThresholdOnly(!overThresholdOnly);
                setPage(1);
              }}
              className={overThresholdOnly ? '' : 'text-destructive hover:text-destructive'}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Over Threshold Only
            </Button>
          }
        />

        <PremiumTable
          columns={columns}
          data={vendors}
          loading={loading}
          showSerialNumber={true}
          emptyMessage="No dues found"
          emptyIcon={<Wallet className="h-12 w-12 text-muted-foreground" />}
          onRowClick={(item) => navigate(`/dues/${item.id}`)}
          actions={{
            onView: (item) => navigate(`/dues/${item.id}`),
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
