import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from 'sonner';

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategory = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ category: any }>(`/api/categories/${id}/`);
    if (response.error || !response.data) {
      toast.error('Category not found');
      navigate('/categories');
    } else {
      const category = response.data.category;
      setName(category.name);
      if (category.image_url) {
        setImagePreview(category.image_url);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) fetchCategory();
  }, [isEdit, fetchCategory]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      let response;
      if (isEdit) {
        response = await api.post(`/api/categories/${id}/edit/`, formData, true);
      } else {
        response = await api.post('/api/categories/create/', formData, true);
      }

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(isEdit ? 'Category updated' : 'Category created');
        navigate('/categories');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Edit Category' : 'New Category'} backLink="/categories" />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{isEdit ? 'Update Category' : 'Create Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Beverages"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded object-cover" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/categories')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
