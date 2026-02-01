import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Wallet, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VendorDue } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

export default function DuesList() {
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
  const [totalDues, setTotalDues] = useState(0);
  const [dueThreshold, setDueThreshold] = useState(1000);
  const [overThresholdCount, setOverThresholdCount] = useState(0);
  
  // Payment dialog
  const [payingVendor, setPayingVendor] = useState<VendorDue | null>(null);
  const [processing, setProcessing] = useState(false);

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
        setTotalDues(response.data.total_dues);
        setDueThreshold(response.data.due_threshold);
        setOverThresholdCount(response.data.over_threshold_count);
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

  const handlePay = async () => {
    if (!payingVendor) return;

    const amount = payingVendor.due_balance;
    if (amount <= 0) {
      toast.error('No dues to collect');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/api/dues/pay/', {
        vendor_id: payingVendor.id,
        amount: amount,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Due payment processed successfully');
        setPayingVendor(null);
        fetchDues();
      }
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const openPayDialog = (vendor: VendorDue) => {
    setPayingVendor(vendor);
  };

  const columns = [
    {
      key: 'name',
      label: 'Vendor',
      render: (item: VendorDue) => (
        <div className="flex items-center gap-2">
          {item.logo_url ? (
            <img src={item.logo_url} alt={item.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs">
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'due_balance',
      label: 'Due Amount',
      render: (item: VendorDue) => (
        <div className="flex items-center gap-2">
          <span className={item.is_over_threshold ? 'text-red-600 font-bold' : ''}>
            ₹{item.due_balance.toLocaleString()}
          </span>
          {item.is_over_threshold && (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (item: VendorDue) => `₹${item.balance.toLocaleString()}`,
    },
    ...(user?.is_superuser ? [{
      key: 'actions',
      label: 'Actions',
      render: (item: VendorDue) => (
        <Button variant="outline" size="sm" onClick={() => openPayDialog(item)}>
          <CreditCard className="h-4 w-4 mr-2" />
          Collect
        </Button>
      ),
    }] : []),
  ];

  const statCards = [
    { label: 'Total Vendors with Dues', value: count, icon: Users, color: 'text-foreground' },
    { label: 'Total Outstanding Dues', value: `₹${totalDues.toLocaleString()}`, icon: Wallet, color: 'text-red-600' },
    { label: 'Over Threshold', value: overThresholdCount, icon: AlertTriangle, color: 'text-yellow-600' },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Dues" 
        description={`Manage vendor dues (Threshold: ₹${dueThreshold.toLocaleString()})`}
      />

      <StatsCards stats={statCards} loading={loading} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        additionalFilters={
          <Button
            variant={overThresholdOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOverThresholdOnly(!overThresholdOnly)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Over Threshold Only
          </Button>
        }
      />

      <Card className="mt-4">
        <CardContent className="p-0">
          <DataTable columns={columns} data={vendors} loading={loading} />
        </CardContent>
      </Card>

      <SimplePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={count}
      />

      {/* Payment Dialog */}
      <Dialog open={!!payingVendor} onOpenChange={() => setPayingVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Due Payment</DialogTitle>
            <DialogDescription>
              Vendor: {payingVendor?.name} | Outstanding: ₹{payingVendor?.due_balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">Full payment to be collected</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{payingVendor?.due_balance.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingVendor(null)}>Cancel</Button>
            <Button onClick={handlePay} disabled={processing}>
              {processing ? 'Processing...' : `Collect ₹${payingVendor?.due_balance.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
