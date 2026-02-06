import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Percent, Wallet, Edit, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { ShareDistributionCard } from '@/components/ui/share-pie-chart';
import { ShareholderInfoCell } from '@/components/ui/vendor-info-cell';
import { ItemActionsModal } from '@/components/ui/item-actions-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shareholder } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface ShareholderStats {
  total_shareholders: number;
  total_percentage: number;
  system_balance: number;
  total_shareholder_balance: number;
  remaining_percentage: number;
  remaining_amount: number;
  distributed_percentage: number;
  distributed_amount: number;
}

export default function ShareholdersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<ShareholderStats>({
    total_shareholders: 0,
    total_percentage: 0,
    system_balance: 0,
    total_shareholder_balance: 0,
    remaining_percentage: 100,
    remaining_amount: 0,
    distributed_percentage: 0,
    distributed_amount: 0,
  });
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [selectedShareholder, setSelectedShareholder] = useState<Shareholder | null>(null);
  const [editForm, setEditForm] = useState({ is_shareholder: true, share_percentage: 0 });
  const [saving, setSaving] = useState(false);

  const fetchShareholders = useCallback(async () => {
    if (!user?.is_superuser) return;

    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      if (appliedSearch) {
        params.search = appliedSearch;
      }

      const queryString = api.buildQueryString(params);
      const response = await api.get<{
        shareholders: Shareholder[];
        count: number;
        total_pages: number;
        total_percentage: number;
        total_balance: number;
        system_balance?: number;
      }>(`/api/shareholders/${queryString}`);

      if (response.error) {
        toast.error('Failed to fetch shareholders');
      } else if (response.data) {
        setShareholders(response.data.shareholders);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        
        const totalPercentage = response.data.total_percentage || 0;
        const totalBalance = response.data.total_balance || 0;
        const systemBalance = response.data.system_balance || 0;
        
        setStats({
          total_shareholders: response.data.count,
          total_percentage: totalPercentage,
          system_balance: systemBalance,
          total_shareholder_balance: totalBalance,
          remaining_percentage: Math.max(0, 100 - totalPercentage),
          remaining_amount: systemBalance * (Math.max(0, 100 - totalPercentage) / 100),
          distributed_percentage: totalPercentage,
          distributed_amount: systemBalance * (totalPercentage / 100),
        });
      }
    } catch (error) {
      toast.error('Failed to fetch shareholders');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch]);

  useEffect(() => {
    if (user?.is_superuser) {
      fetchShareholders();
    }
  }, [user, fetchShareholders]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const handleEdit = (shareholder: Shareholder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingShareholder(shareholder);
    setEditForm({
      is_shareholder: shareholder.is_shareholder,
      share_percentage: shareholder.share_percentage,
    });
  };

  const handleSave = async () => {
    if (!editingShareholder) return;

    setSaving(true);
    try {
      const response = await api.post(`/api/shareholders/${editingShareholder.id}/update/`, editForm);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Shareholder updated');
        setEditingShareholder(null);
        fetchShareholders();
      }
    } catch (error) {
      toast.error('Failed to update shareholder');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Shareholder',
      render: (item: Shareholder) => (
        <ShareholderInfoCell
          name={item.name}
          phone={item.phone}
          logoUrl={item.logo_url}
          percentage={item.share_percentage}
        />
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right' as const,
      hideOnMobile: true,
      render: (item: Shareholder) => (
        <span className="font-semibold text-success">
          {formatCurrency(item.balance)}
        </span>
      ),
    },
    {
      key: 'due_balance',
      label: 'Dues',
      align: 'right' as const,
      hideOnMobile: true,
      render: (item: Shareholder) => (
        <span className={item.due_balance > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
          {formatCurrency(item.due_balance)}
        </span>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Shareholders', value: stats.total_shareholders, icon: Users, variant: 'default' as const },
    { label: 'Total Percentage', value: `${stats.total_percentage}%`, icon: Percent, variant: stats.total_percentage > 100 ? 'destructive' as const : 'success' as const },
    { label: 'System Balance', value: formatCurrency(stats.system_balance), icon: Building2, variant: 'info' as const },
    { label: 'Shareholder Balance', value: formatCurrency(stats.total_shareholder_balance), icon: Wallet, variant: 'highlight' as const },
  ];

  const renderMobileCard = (shareholder: Shareholder) => (
    <CardContent className="p-4">
      <ShareholderInfoCell
        name={shareholder.name}
        phone={shareholder.phone}
        logoUrl={shareholder.logo_url}
        percentage={shareholder.share_percentage}
        balance={shareholder.balance}
      />
      <div className="mt-3 space-y-1">
        <MobileCardRow
          label="Due Balance"
          value={
            <span className={shareholder.due_balance > 0 ? 'text-destructive font-semibold' : ''}>
              {formatCurrency(shareholder.due_balance)}
            </span>
          }
        />
      </div>
    </CardContent>
  );

  const shareholderModalActions = selectedShareholder
    ? [
        { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/shareholders/${selectedShareholder.id}`), variant: 'view' as const },
        { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleEdit(selectedShareholder), variant: 'edit' as const },
      ]
    : [];

  if (!user?.is_superuser) {
    return (
      <DashboardLayout>
        <PageHeader title="Shareholders" description="Access denied" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Only super admins can view shareholders.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader title="Shareholders" description="Manage shareholders and their share percentages" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PremiumStatsCards stats={statCards} loading={loading} columns={2} className="mb-0" />
          </div>
          <div>
            <ShareDistributionCard
              distributedPercentage={stats.distributed_percentage}
              distributedAmount={stats.distributed_amount}
              remainingPercentage={stats.remaining_percentage}
              remainingAmount={stats.remaining_amount}
              totalAmount={stats.system_balance}
            />
          </div>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          placeholder="Search shareholders..."
        />

        <PremiumTable
          columns={columns}
          data={shareholders}
          loading={loading}
          showSerialNumber={true}
          emptyMessage="No shareholders found"
          onRowClick={(item) => navigate(`/shareholders/${item.id}`)}
          onMobileCardClick={(item) => setSelectedShareholder(item)}
          actions={{
            onView: (item) => navigate(`/shareholders/${item.id}`),
            onEdit: (item) => handleEdit(item),
          }}
          mobileCard={renderMobileCard}
        />

        <ItemActionsModal
          open={!!selectedShareholder}
          onOpenChange={(open) => !open && setSelectedShareholder(null)}
          title={selectedShareholder?.name ?? ''}
          description={selectedShareholder ? `${selectedShareholder.share_percentage}% · ${formatCurrency(selectedShareholder.balance ?? 0)}` : undefined}
          actions={shareholderModalActions}
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

        {/* Edit Dialog */}
        <Dialog open={!!editingShareholder} onOpenChange={() => setEditingShareholder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Shareholder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingShareholder && (
                <ShareholderInfoCell
                  name={editingShareholder.name}
                  phone={editingShareholder.phone}
                  logoUrl={editingShareholder.logo_url}
                  percentage={editingShareholder.share_percentage}
                  className="mb-4"
                />
              )}
              <div className="flex items-center justify-between">
                <Label>Shareholder Status</Label>
                <Switch
                  checked={editForm.is_shareholder}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_shareholder: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Share Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.share_percentage}
                  onChange={(e) => setEditForm({ ...editForm, share_percentage: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Current total: {stats.total_percentage}% | Remaining: {stats.remaining_percentage}%
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingShareholder(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
