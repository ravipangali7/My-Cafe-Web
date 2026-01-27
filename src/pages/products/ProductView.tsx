import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { canEditItem, canDeleteItem } from '@/lib/permissions';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Variant {
  id: number;
  price: string;
  discount_type: string | null;
  discount_value: string;
  unit_name: string;
  unit_symbol: string;
}

interface Product {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  variants: Variant[];
}

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ product: Product }>(`/api/products/${id}/`);
    if (response.error || !response.data) {
      toast.error('Product not found');
      navigate('/products');
    } else {
      setProduct(response.data.product);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get(`/api/products/${id}/delete/`);

    if (response.error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      navigate('/products');
    }
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/products" />
      </DashboardLayout>
    );
  }

  const variantColumns = [
    {
      key: 'unit',
      label: 'Unit',
      render: (item: Variant) => `${item.unit_name} (${item.unit_symbol})`,
    },
    {
      key: 'price',
      label: 'Price',
      render: (item: Variant) => `₹${Number(item.price).toFixed(2)}`,
    },
    {
      key: 'discount',
      label: 'Discount',
      render: (item: Variant) =>
        item.discount_type
          ? `${item.discount_value}${item.discount_type === 'percentage' ? '%' : ' flat'}`
          : '—',
    },
  ];

  const canEdit = product ? canEditItem(user, product) : false;
  const canDelete = product ? canDeleteItem(user, product) : false;

  return (
    <DashboardLayout>
      <PageHeader
        title={product.name}
        backLink="/products"
        action={
          (canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the product and all its variants.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )
        }
      />

      <div className="space-y-6">
        <DetailCard title="Product Details">
          {product.image_url && (
            <DetailRow
              label="Image"
              value={<img src={product.image_url} alt={product.name} className="h-20 w-20 rounded object-cover" />}
            />
          )}
          <DetailRow label="Name" value={product.name} />
          <DetailRow label="Category" value={product.category_name} />
          <DetailRow
            label="Type"
            value={<StatusBadge status={product.type} variant={product.type === 'veg' ? 'success' : 'destructive'} />}
          />
          <DetailRow
            label="Status"
            value={
              <StatusBadge
                status={product.is_active ? 'Active' : 'Inactive'}
                variant={getActiveStatusVariant(product.is_active)}
              />
            }
          />
          <DetailRow label="Created At" value={new Date(product.created_at).toLocaleString()} />
          <DetailRow label="Updated At" value={new Date(product.updated_at).toLocaleString()} />
        </DetailCard>

        <div>
          <h3 className="text-lg font-semibold mb-4">Product Variants</h3>
          <DataTable columns={variantColumns} data={product.variants} emptyMessage="No variants" />
        </div>
      </div>
    </DashboardLayout>
  );
}
