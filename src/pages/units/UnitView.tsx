import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
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

interface Unit {
  id: number;
  name: string;
  symbol: string;
  created_at: string;
  updated_at: string;
}

export default function UnitView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUnit = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ unit: Unit }>(`/api/units/${id}/`);
    if (response.error || !response.data) {
      toast.error('Unit not found');
      navigate('/units');
    } else {
      setUnit(response.data.unit);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchUnit();
  }, [fetchUnit]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get(`/api/units/${id}/delete/`);

    if (response.error) {
      toast.error('Failed to delete unit');
    } else {
      toast.success('Unit deleted');
      navigate('/units');
    }
  }, [id, navigate]);

  if (loading || !unit) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/units" />
      </DashboardLayout>
    );
  }

  const canEdit = unit ? canEditItem(user, unit) : false;
  const canDelete = unit ? canDeleteItem(user, unit) : false;

  return (
    <DashboardLayout>
      <PageHeader
        title={unit.name}
        backLink="/units"
        action={
          (canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" onClick={() => navigate(`/units/${id}/edit`)}>
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
                      <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
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

      <DetailCard title="Unit Details">
        <DetailRow label="Name" value={unit.name} />
        <DetailRow label="Symbol" value={unit.symbol} />
        <DetailRow label="Created At" value={new Date(unit.created_at).toLocaleString()} />
        <DetailRow label="Updated At" value={new Date(unit.updated_at).toLocaleString()} />
      </DetailCard>
    </DashboardLayout>
  );
}
