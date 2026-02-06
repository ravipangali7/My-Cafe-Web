import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Package, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { PremiumStatsCards } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ItemActionsModal } from '@/components/ui/item-actions-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { canEditItem, canDeleteItem } from '@/lib/permissions';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  category_name: string | null;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
}

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  top_selling?: number;
}

export default function ProductsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isActiveFromUrl = searchParams.get('is_active');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [appliedIsActive, setAppliedIsActive] = useState<string | null>(isActiveFromUrl === 'true' ? 'true' : isActiveFromUrl === 'false' ? 'false' : null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    inactive: 0,
    top_selling: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
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
      if (appliedIsActive !== null) {
        params.is_active = appliedIsActive;
      }
      if (appliedStartDate) {
        params.start_date = appliedStartDate;
      }
      if (appliedEndDate) {
        params.end_date = appliedEndDate;
      }

      const response = await fetchPaginated<Product>('/api/products/', params);
      
      if (response.error) {
        toast.error('Failed to fetch products');
      } else if (response.data) {
        setProducts(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch, appliedUserId, appliedIsActive, appliedStartDate, appliedEndDate]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoadingStats(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      
      const queryString = api.buildQueryString(params);
      const response = await api.get<ProductStats>(`/api/stats/products/${queryString}`);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch product stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, appliedUserId]);

  useEffect(() => {
    setAppliedIsActive(isActiveFromUrl === 'true' ? 'true' : isActiveFromUrl === 'false' ? 'false' : null);
  }, [isActiveFromUrl]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchStats();
    }
  }, [user, fetchProducts, fetchStats]);

  // Refetch when user returns to tab (real-time data)
  useEffect(() => {
    if (!user) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts();
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user, fetchProducts, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const response = await api.get(`/api/products/${deleteId}/delete/`);

    if (response.error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchProducts();
      fetchStats();
    }
    setDeleteId(null);
  }, [deleteId, fetchProducts, fetchStats]);

  const handleToggleStatus = useCallback(
    async (product: Product) => {
      if (togglingId !== null || !canEditItem(user, product)) return;
      const newActive = !product.is_active;
      setTogglingId(product.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newActive } : p))
      );
      try {
        const formData = new FormData();
        formData.append('is_active', String(newActive));
        const response = await api.post(
          `/api/products/${product.id}/edit/`,
          formData,
          true
        );
        if (response.error) {
          toast.error(response.error || 'Failed to update status');
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p))
          );
        } else {
          toast.success(newActive ? 'Product activated' : 'Product deactivated');
          fetchProducts();
          fetchStats();
        }
      } catch {
        toast.error('Failed to update status');
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p))
        );
      } finally {
        setTogglingId(null);
      }
    },
    [user, togglingId, fetchProducts, fetchStats]
  );

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

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (item: Product) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={item.image_url || undefined} alt={item.name} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-accent">
              <Package className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.category_name || 'No category'}</p>
          </div>
        </div>
      ),
    },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'Vendor',
      hideOnMobile: true,
      render: (item: Product) => {
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
      key: 'type',
      label: 'Type',
      hideOnMobile: true,
      render: (item: Product) => (
        <StatusBadge status={item.type} variant={item.type === 'veg' ? 'success' : 'destructive'} />
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      hideOnMobile: true,
      render: (item: Product) => (
        <div className="flex items-center gap-2">
          {canEditItem(user, item) ? (
            <Switch
              checked={item.is_active}
              disabled={togglingId === item.id}
              onCheckedChange={() => handleToggleStatus(item)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
          <StatusBadge
            status={item.is_active ? 'Active' : 'Inactive'}
            variant={getActiveStatusVariant(item.is_active)}
          />
        </div>
      ),
    },
  ];

  const applyIsActiveFilter = (value: boolean | null) => {
    setAppliedIsActive(value === null ? null : value ? 'true' : 'false');
    setPage(1);
    if (value === null) {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('is_active');
        return next;
      });
    } else {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.set('is_active', String(value));
        return next;
      });
    }
  };

  const statCards = [
    { label: 'Total Products', value: stats.total, icon: Package, variant: 'default' as const, onClick: () => applyIsActiveFilter(null) },
    { label: 'Active', value: stats.active, icon: CheckCircle, variant: 'success' as const, onClick: () => applyIsActiveFilter(true) },
    { label: 'Inactive', value: stats.inactive, icon: XCircle, variant: 'destructive' as const, onClick: () => applyIsActiveFilter(false) },
    { label: 'Top Selling', value: stats.top_selling || 0, icon: TrendingUp, variant: 'highlight' as const },
  ];

  const renderMobileCard = (product: Product) => (
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-16 w-16 rounded-lg flex-shrink-0">
          <AvatarImage src={product.image_url || undefined} alt={product.name} className="object-cover" />
          <AvatarFallback className="rounded-lg bg-accent">
            <Package className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.category_name || 'No category'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={product.type} variant={product.type === 'veg' ? 'success' : 'destructive'} />
            {canEditItem(user, product) ? (
              <Switch
                checked={product.is_active}
                disabled={togglingId === product.id}
                onCheckedChange={() => handleToggleStatus(product)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
            <StatusBadge
              status={product.is_active ? 'Active' : 'Inactive'}
              variant={getActiveStatusVariant(product.is_active)}
            />
          </div>
        </div>
      </div>
    </CardContent>
  );

  const productModalActions = selectedProduct
    ? [
        { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/products/${selectedProduct.id}`), variant: 'view' as const },
        ...(canEditItem(user, selectedProduct) ? [{ label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => navigate(`/products/${selectedProduct.id}/edit`), variant: 'edit' as const }] : []),
        ...(canDeleteItem(user, selectedProduct) ? [{ label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(selectedProduct.id), variant: 'delete' as const }] : []),
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title="Products"
          description="Manage your menu items"
          action={
            <Button onClick={() => navigate('/products/new')} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          }
        />

        <PremiumStatsCards stats={statCards} loading={loadingStats} columns={4} />
        
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          userId={userId}
          onUserIdChange={setUserId}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          showUserFilter={user?.is_superuser}
          placeholder="Search products..."
          additionalFilters={
            <DateFilterButtons
              activeFilter={dateFilter}
              onFilterChange={handleDateFilterChange}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              compact
            />
          }
        />

        <PremiumTable
          columns={columns}
          data={products}
          loading={loading}
          showSerialNumber={true}
          emptyMessage="No products found"
          onRowClick={(item) => navigate(`/products/${item.id}`)}
          onMobileCardClick={(item) => setSelectedProduct(item)}
          actions={{
            onView: (item) => navigate(`/products/${item.id}`),
            onEdit: canEditItem(user, {}) ? (item) => navigate(`/products/${item.id}/edit`) : undefined,
            onDelete: canDeleteItem(user, {}) ? (item) => setDeleteId(item.id) : undefined,
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

        <ItemActionsModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          title={selectedProduct?.name ?? ''}
          description={selectedProduct ? (selectedProduct.category_name ?? 'No category') : undefined}
          actions={productModalActions}
        />

        <ConfirmationModal
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Product"
          description="This will delete the product and all its variants. This action cannot be undone."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
