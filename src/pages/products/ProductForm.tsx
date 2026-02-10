import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { MultiFormRow } from '@/components/forms/MultiFormRow';
import { useIsMobile } from '@/hooks/use-mobile';
import { api, fetchPaginated, isWebView } from '@/lib/api';
import { requestFileFromFlutter, filePayloadToFile, type WebViewFilePayload } from '@/lib/webview-upload';
import { cn } from '@/lib/utils';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

interface Variant {
  id?: number;
  unit_id: string;
  price: string;
  discount_type: string;
  discount_value: string;
}

const emptyVariant: Variant = {
  unit_id: '',
  price: '',
  discount_type: '',
  discount_value: '0',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const isMobile = useIsMobile();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFilePayload, setImageFilePayload] = useState<WebViewFilePayload | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [type, setType] = useState<'veg' | 'non-veg'>('veg');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    const response = await fetchPaginated<Category>('/api/categories/', { page_size: 1000 });
    if (response.data) {
      setCategories(response.data.data || []);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    const response = await fetchPaginated<Unit>('/api/units/', { page_size: 1000 });
    if (response.data) {
      setUnits(response.data.data || []);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ product: any }>(`/api/products/${id}/`);
    if (response.error || !response.data) {
      toast.error('Product not found');
      navigate('/products');
    } else {
      const product = response.data.product;
      setName(product.name);
      setCategoryId(String(product.category));
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
      setType(product.type as 'veg' | 'non-veg');
      setIsActive(product.is_active);
      if (product.variants?.length) {
        setVariants(
          product.variants.map((v: any) => ({
            id: v.id,
            unit_id: String(v.unit),
            price: String(v.price),
            discount_type: v.discount_type || '',
            discount_value: String(v.discount_value),
          }))
        );
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (vendor) {
      fetchCategories();
      fetchUnits();
      if (isEdit) fetchProduct();
    }
  }, [vendor, isEdit, fetchCategories, fetchUnits, fetchProduct]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageFilePayload(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebViewImageUpload = async () => {
    if (!isWebView()) return;
    setUploadingImage(true);
    try {
      const payload = await requestFileFromFlutter({ accept: 'image/*', field: 'product_image' });
      setImageFilePayload(payload);
      setImageFile(null);
      setImagePreview(payload.dataUrl);
      toast.success('Image selected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to select image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    const validVariants = variants.filter((v) => v.unit_id && v.price);
    if (validVariants.length === 0) {
      toast.error('Please add at least one variant');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category_id', categoryId);
      formData.append('type', type);
      formData.append('is_active', String(isActive));
      formData.append('variants', JSON.stringify(validVariants));

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageFilePayload) {
        const file = await filePayloadToFile(imageFilePayload);
        formData.append('image', file);
      }

      let response;
      if (isEdit) {
        response = await api.post(`/api/products/${id}/edit/`, formData, true);
      } else {
        response = await api.post('/api/products/create/', formData, true);
      }

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(isEdit ? 'Product updated' : 'Product created');
        navigate('/products');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    }

    setLoading(false);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} backLink="/products" />

      <form onSubmit={handleSubmit} className={cn('space-y-6', isMobile && 'pb-4')}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cappuccino"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'veg' | 'non-veg')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non-veg">Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                {isWebView() ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleWebViewImageUpload}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Selecting...' : (imagePreview ? 'Change Image' : 'Upload Image')}
                  </Button>
                ) : (
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiFormRow
              items={variants}
              onAdd={() => setVariants([...variants, { ...emptyVariant }])}
              onRemove={(index) => setVariants(variants.filter((_, i) => i !== index))}
              addLabel="Add Variant"
              renderItem={(variant, index) => (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={variant.unit_id}
                      onValueChange={(v) => updateVariant(index, 'unit_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {(units || []).map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={variant.discount_type || 'none'}
                      onValueChange={(v) => updateVariant(index, 'discount_type', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.discount_value}
                      onChange={(e) => updateVariant(index, 'discount_value', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className={cn(
          'flex gap-3',
          isMobile && 'z-20 mt-6 pt-4 pb-2 -mx-4 px-4 bg-background/95 backdrop-blur border-t border-border safe-area-bottom md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:bg-transparent md:border-0'
        )}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
