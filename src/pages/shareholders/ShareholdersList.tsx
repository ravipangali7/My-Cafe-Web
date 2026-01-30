import { useEffect, useState, useCallback } from 'react';
import { Users, Percent, Wallet, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
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

export default function ShareholdersList() {
  const { user } = useAuth();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
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
      }>(`/api/shareholders/${queryString}`);

      if (response.error) {
        toast.error('Failed to fetch shareholders');
      } else if (response.data) {
        setShareholders(response.data.shareholders);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        setTotalPercentage(response.data.total_percentage);
        setTotalBalance(response.data.total_balance);
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

  const handleEdit = (shareholder: Shareholder) => {
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
      label: 'Name',
      render: (item: Shareholder) => (
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
      key: 'share_percentage',
      label: 'Share %',
      render: (item: Shareholder) => `${item.share_percentage}%`,
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (item: Shareholder) => `₹${item.balance.toLocaleString()}`,
    },
    {
      key: 'due_balance',
      label: 'Dues',
      render: (item: Shareholder) => (
        <span className={item.due_balance > 0 ? 'text-red-600' : ''}>
          ₹{item.due_balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Shareholder) => (
        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Shareholders', value: count, icon: Users, color: 'text-foreground' },
    { label: 'Total Percentage', value: `${totalPercentage}%`, icon: Percent, color: totalPercentage > 100 ? 'text-red-600' : 'text-green-600' },
    { label: 'Total Balance', value: `₹${totalBalance.toLocaleString()}`, icon: Wallet, color: 'text-blue-600' },
  ];

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
      <PageHeader title="Shareholders" description="Manage shareholders and their share percentages" />

      <StatsCards stats={statCards} loading={loading} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <Card className="mt-4">
        <CardContent className="p-0">
          <DataTable columns={columns} data={shareholders} loading={loading} />
        </CardContent>
      </Card>

      <SimplePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={count}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingShareholder} onOpenChange={() => setEditingShareholder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shareholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
    </DashboardLayout>
  );
}
