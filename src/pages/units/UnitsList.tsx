import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Unit {
  id: number;
  name: string;
  symbol: string;
  created_at: string;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
}

export default function UnitsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
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
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchUnits = useCallback(async () => {
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

      const response = await fetchPaginated<Unit>('/api/units/', params);
      
      if (response.error) {
        toast.error('Failed to fetch units');
      } else if (response.data) {
        setUnits(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch units');
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
      }>(`/api/stats/units/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch unit stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId]);

  useEffect(() => {
    if (user) {
      fetchUnits();
      fetchStats();
    }
  }, [user, fetchUnits, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const response = await api.get(`/api/units/${deleteId}/delete/`);

    if (response.error) {
      toast.error('Failed to delete unit');
    } else {
      toast.success('Unit deleted');
      fetchUnits();
      fetchStats();
    }
    setDeleteId(null);
  }, [deleteId, fetchUnits, fetchStats]);

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

  const columns = [
    { key: 'name', label: 'Name' },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'User',
      render: (item: Unit) => {
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
    { key: 'symbol', label: 'Symbol' },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: Unit) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Unit) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/units/${item.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/units/${item.id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Units', value: stats.total, icon: Scale, color: 'text-foreground' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Units"
        description="Manage measurement units for your products"
        action={
          <Button onClick={() => navigate('/units/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        }
      />

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

      <DataTable columns={columns} data={units} loading={loading} emptyMessage="No units found" />

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Products using this unit may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
