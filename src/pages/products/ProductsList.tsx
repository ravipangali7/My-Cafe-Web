import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Package, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
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

export default function ProductsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
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
  });
  const [loadingStats, setLoadingStats] = useState(true);

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
        active: number;
        inactive: number;
      }>(`/api/stats/products/${queryString}`);
      
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
    if (user) {
      fetchProducts();
      fetchStats();
    }
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
    {
      key: 'image',
      label: 'Image',
      render: (item: Product) =>
        item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-accent" />
        ),
    },
    { key: 'name', label: 'Name' },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'User',
      render: (item: Product) => {
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
      key: 'category',
      label: 'Category',
      render: (item: Product) => item.category_name || '—',
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: Product) => (
        <StatusBadge status={item.type} variant={item.type === 'veg' ? 'success' : 'destructive'} />
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Product) => (
        <StatusBadge
          status={item.is_active ? 'Active' : 'Inactive'}
          variant={getActiveStatusVariant(item.is_active)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Product) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${item.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${item.id}/edit`)}>
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
    { label: 'Total Products', value: stats.total, icon: Package, color: 'text-foreground' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Products"
        description="Manage your menu items"
        action={
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
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

      <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products found" />

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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the product and all its variants.
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
