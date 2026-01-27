import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { Switch } from '@/components/ui/switch';
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
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  expire_date: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function VendorsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
    active: 0,
    inactive: 0,
    superusers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchVendors = useCallback(async () => {
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

      const response = await fetchPaginated<Vendor>('/api/vendors/', params);
      
      if (response.error) {
        toast.error('Failed to fetch vendors');
      } else if (response.data) {
        setVendors(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch, appliedUserId]);

  const fetchStats = useCallback(async () => {
    if (!user?.is_superuser) {
      setLoadingStats(false);
      return;
    }
    
    setLoadingStats(true);
    try {
      const response = await api.get<{
        total: number;
        active: number;
        inactive: number;
        superusers: number;
      }>('/api/stats/vendors/');
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendor stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVendors();
      fetchStats();
    }
  }, [user, fetchVendors, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const response = await api.delete(`/api/vendors/${deleteId}/delete/`);

    if (response.error) {
      toast.error('Failed to delete vendor');
    } else {
      toast.success('Vendor deleted');
      fetchVendors();
      fetchStats();
    }
    setDeleteId(null);
  }, [deleteId, fetchVendors, fetchStats]);

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

  const handleToggleActive = useCallback(async (vendorId: number, currentStatus: boolean) => {
    if (!user?.is_superuser) return;

    const newStatus = !currentStatus;
    
    // Optimistically update the UI
    setVendors(prevVendors =>
      prevVendors.map(vendor =>
        vendor.id === vendorId ? { ...vendor, is_active: newStatus } : vendor
      )
    );

    try {
      const formData = new FormData();
      formData.append('is_active', newStatus.toString());

      const response = await api.put<{ vendor: any; message: string }>(
        `/api/vendors/${vendorId}/edit/`,
        formData,
        true
      );

      if (response.error) {
        // Revert on error
        setVendors(prevVendors =>
          prevVendors.map(vendor =>
            vendor.id === vendorId ? { ...vendor, is_active: currentStatus } : vendor
          )
        );
        toast.error(response.error || 'Failed to update status');
      } else {
        toast.success(`Vendor ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      // Revert on error
      setVendors(prevVendors =>
        prevVendors.map(vendor =>
          vendor.id === vendorId ? { ...vendor, is_active: currentStatus } : vendor
        )
      );
      toast.error('Failed to update status');
    }
  }, [user, fetchStats]);

  const columns = [
    {
      key: 'logo',
      label: 'Logo',
      render: (item: Vendor) =>
        item.logo_url ? (
          <img src={item.logo_url} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-foreground font-medium">
            {item.name.charAt(0).toUpperCase()}
          </div>
        ),
    },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_superuser',
      label: 'Role',
      render: (item: Vendor) => (
        item.is_superuser ? (
          <StatusBadge status="Superuser" variant="default" />
        ) : (
          <StatusBadge status="Vendor" variant="secondary" />
        )
      ),
    },
    {
      key: 'expire_date',
      label: 'Expires',
      render: (item: Vendor) =>
        item.expire_date ? new Date(item.expire_date).toLocaleDateString() : '—',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Vendor) => {
        // Show editable switch for super admin, badge for others
        if (user?.is_superuser) {
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={item.is_active}
                onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
              />
              <span className="text-sm text-muted-foreground">
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          );
        }
        return (
          <StatusBadge
            status={item.is_active ? 'Active' : 'Inactive'}
            variant={getActiveStatusVariant(item.is_active)}
          />
        );
      },
    },
  ];

  const statCards = user?.is_superuser ? [
    { label: 'Total Vendors', value: stats.total, icon: Users, color: 'text-foreground' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-red-600' },
    { label: 'Superusers', value: stats.superusers, icon: Shield, color: 'text-blue-600' },
  ] : [];

  return (
    <DashboardLayout>
      <PageHeader
        title={user?.is_superuser ? "Vendors" : "Vendor Profile"}
        description={user?.is_superuser ? "Manage all vendors" : "Manage all vendors"}
        action={
          user?.is_superuser ? (
            <Button onClick={() => navigate('/vendors/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          ) : (
            <Button onClick={() => navigate('/vendors/edit')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )
        }
      />

      {user?.is_superuser && (
        <>
          <StatsCards stats={statCards} loading={loadingStats} />
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            userId={userId}
            onUserIdChange={setUserId}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            showUserFilter={false}
          />
        </>
      )}

      <DataTable 
        columns={columns} 
        data={vendors} 
        loading={loading} 
        emptyMessage="No vendors found"
        onRowClick={(item) => navigate(`/vendors/${item.id}`)}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vendor and all associated data. This action cannot be undone.
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
