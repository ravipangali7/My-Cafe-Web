import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Users, UserCheck, UserX, Shield, Clock, AlertTriangle, Ban, IndianRupee, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { TimeRemaining, TimeRemainingBadge } from '@/components/ui/time-remaining';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Switch } from '@/components/ui/switch';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  expire_date: string | null;
  is_active: boolean;
  is_superuser: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  due_balance: number;
  created_at: string;
}

interface VendorStats {
  total: number;
  active: number;
  inactive: number;
  superusers: number;
  kyc_pending: number;
  subscription_expired: number;
  total_due_amount: number;
  due_blocked_vendors: number;
}

export default function VendorsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
  const [stats, setStats] = useState<VendorStats>({
    total: 0,
    active: 0,
    inactive: 0,
    superusers: 0,
    kyc_pending: 0,
    subscription_expired: 0,
    total_due_amount: 0,
    due_blocked_vendors: 0,
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
      const response = await api.get<VendorStats>('/api/stats/vendors/');
      
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

      const response = await api.put<{ vendor: Vendor; message: string }>(
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
        fetchStats();
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

  const getKYCStatusVariant = (status: string): 'success' | 'warning' | 'destructive' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'warning';
    }
  };

  const columns = [
    {
      key: 'details',
      label: 'Details',
      render: (item: Vendor) => (
        <VendorInfoCell
          name={item.name}
          phone={item.phone}
          logoUrl={item.logo_url}
          size="md"
        />
      ),
    },
    {
      key: 'expire_date',
      label: 'Expire Details',
      hideOnMobile: true,
      render: (item: Vendor) => (
        <TimeRemaining expiryDate={item.expire_date} compact />
      ),
    },
    {
      key: 'kyc_status',
      label: 'KYC Status',
      hideOnMobile: true,
      render: (item: Vendor) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            status={item.kyc_status}
            variant={getKYCStatusVariant(item.kyc_status)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/kyc/${item.id}`);
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      key: 'due_balance',
      label: 'Due',
      hideOnMobile: true,
      render: (item: Vendor) => (
        <span className={item.due_balance > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
          {formatCurrency(item.due_balance || 0)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      hideOnMobile: true,
      render: (item: Vendor) => {
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
    { label: 'Total Vendors', value: stats.total, icon: Users, variant: 'default' as const },
    { label: 'Active', value: stats.active, icon: UserCheck, variant: 'success' as const },
    { label: 'Inactive', value: stats.inactive, icon: UserX, variant: 'destructive' as const },
    { label: 'KYC Pending', value: stats.kyc_pending || 0, icon: Clock, variant: 'warning' as const },
    { label: 'Subscription Expired', value: stats.subscription_expired || 0, icon: AlertTriangle, variant: 'destructive' as const },
    { label: 'Total Due Amount', value: formatCurrency(stats.total_due_amount || 0), icon: IndianRupee, variant: 'warning' as const },
    { label: 'Due Blocked', value: stats.due_blocked_vendors || 0, icon: Ban, variant: 'destructive' as const },
  ] : [];

  const renderMobileCard = (vendor: Vendor, index: number) => (
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={vendor.logo_url || undefined} alt={vendor.name} />
          <AvatarFallback className="bg-accent text-foreground font-medium">
            {vendor.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{vendor.name}</p>
              <p className="text-sm text-muted-foreground">{vendor.phone}</p>
            </div>
            <StatusBadge
              status={vendor.is_active ? 'Active' : 'Inactive'}
              variant={getActiveStatusVariant(vendor.is_active)}
            />
          </div>
          
          <div className="mt-3 space-y-2">
            <MobileCardRow
              label="Expiry"
              value={<TimeRemaining expiryDate={vendor.expire_date} compact />}
            />
            <MobileCardRow
              label="KYC"
              value={
                <StatusBadge
                  status={vendor.kyc_status}
                  variant={getKYCStatusVariant(vendor.kyc_status)}
                />
              }
            />
            <MobileCardRow
              label="Due Balance"
              value={
                <span className={vendor.due_balance > 0 ? 'text-destructive font-semibold' : ''}>
                  {formatCurrency(vendor.due_balance || 0)}
                </span>
              }
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/vendors/${vendor.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {(user?.is_superuser || vendor.id === user?.id) && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(vendor.id === user?.id ? '/vendors/edit' : `/vendors/${vendor.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {user?.is_superuser && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(vendor.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardContent>
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title={user?.is_superuser ? "Vendors" : "Vendor Profile"}
          description={user?.is_superuser ? "Manage all vendors" : "Your vendor profile"}
          action={
            user?.is_superuser ? (
              <Button onClick={() => navigate('/vendors/new')} className="touch-target">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            ) : (
              <Button onClick={() => navigate('/vendors/edit')} className="touch-target">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )
          }
        />

        {user?.is_superuser && (
          <>
            <PremiumStatsCards stats={statCards} loading={loadingStats} columns={4} />
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

        <PremiumTable
          columns={columns}
          data={vendors}
          loading={loading}
          showSerialNumber={true}
          emptyMessage="No vendors found"
          onRowClick={(item) => navigate(`/vendors/${item.id}`)}
          actions={{
            onView: (item) => navigate(`/vendors/${item.id}`),
            onEdit: (item) => navigate(item.id === user?.id ? '/vendors/edit' : `/vendors/${item.id}/edit`),
            onDelete: user?.is_superuser ? (item) => setDeleteId(item.id) : undefined,
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

        <ConfirmationModal
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Vendor"
          description="This will permanently delete the vendor and all associated data. This action cannot be undone."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
