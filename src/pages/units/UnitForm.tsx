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

export default function UnitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUnit = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ unit: any }>(`/api/units/${id}/`);
    if (response.error || !response.data) {
      toast.error('Unit not found');
      navigate('/units');
    } else {
      const unit = response.data.unit;
      setName(unit.name);
      setSymbol(unit.symbol);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) fetchUnit();
  }, [isEdit, fetchUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setLoading(true);

    try {
      const response = await api.post(
        isEdit ? `/api/units/${id}/edit/` : '/api/units/create/',
        { name, symbol }
      );

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(isEdit ? 'Unit updated' : 'Unit created');
        navigate('/units');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save unit');
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Edit Unit' : 'New Unit'} backLink="/units" />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{isEdit ? 'Update Unit' : 'Create Unit'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kilogram"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., kg"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Unit' : 'Create Unit'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/units')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
