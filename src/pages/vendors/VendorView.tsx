import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FcmToken {
  id: number;
  token: string;
  created_at: string;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  expire_date: string | null;
  token: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function VendorView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [fcmTokens, setFcmTokens] = useState<FcmToken[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      let response;
      // If id exists in params and user is superuser, fetch that vendor
      // If id matches logged-in user, use auth endpoint
      // If no id, use auth endpoint (own profile)
      if (id && user.is_superuser && parseInt(id) !== user.id) {
        // Superuser viewing another vendor
        response = await api.get<{ vendor: Vendor }>(`/api/vendors/${id}/`);
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.vendor);
      } else if (id && parseInt(id) === user.id) {
        // Viewing own profile with id in URL
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else if (!id) {
        // No id, viewing own profile
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else {
        // Regular user trying to view another vendor - not allowed
        toast.error('You can only view your own profile');
        navigate('/vendors');
        setLoading(false);
        return;
      }
    } catch (error) {
      toast.error('Failed to fetch vendor profile');
      navigate('/vendors');
    }
    setLoading(false);
  }, [user, id, navigate]);

  const fetchFcmTokens = useCallback(async () => {
    if (!user) return;
    
    // Only fetch FCM tokens when viewing own profile
    const viewingOwnProfile = !id || (id && parseInt(id) === user.id);
    if (!viewingOwnProfile) {
      setFcmTokens([]);
      return;
    }
    
    const response = await api.get<{ fcm_tokens: FcmToken[] }>('/api/auth/user/fcm-tokens/');
    if (response.error) {
      toast.error('Failed to fetch FCM tokens');
    } else if (response.data) {
      setFcmTokens(response.data.fcm_tokens);
    }
  }, [user, id]);

  useEffect(() => {
    if (user) {
      fetchVendor();
      fetchFcmTokens();
    }
  }, [user, id, fetchVendor, fetchFcmTokens]);

  if (loading || !vendor) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/vendors" />
      </DashboardLayout>
    );
  }

  const fcmColumns = [
    {
      key: 'token',
      label: 'Token',
      render: (item: FcmToken) => item.token.slice(0, 30) + '...',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: FcmToken) => new Date(item.created_at).toLocaleString(),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={vendor.name}
        backLink="/vendors"
        action={
          <div className="flex gap-2">
            {(!id || (id && parseInt(id) === user?.id)) && (
              <Button variant="outline" onClick={() => navigate(`/qr/${vendor.phone}`)}>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR
              </Button>
            )}
            {(user?.is_superuser || !id || (id && parseInt(id) === user?.id)) && (
              <Button variant="outline" onClick={() => navigate(id ? `/vendors/${id}/edit` : '/vendors/edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <DetailCard title="Vendor Details">
          {vendor.logo_url != null && (
            <DetailRow
              label="Logo"
              value={<img src={vendor.logo_url} alt={vendor.name} className="h-16 w-16 rounded-full object-cover" />}
            />
          )}
          <DetailRow label="Name" value={vendor.name} />
          <DetailRow label="Phone" value={vendor.phone} />
          <DetailRow
            label="Expire Date"
            value={vendor.expire_date ? new Date(vendor.expire_date).toLocaleDateString() : '—'}
          />
          <DetailRow label="Token" value={vendor.token} />
          <DetailRow
            label="Status"
            value={
              <StatusBadge
                status={vendor.is_active ? 'Active' : 'Inactive'}
                variant={getActiveStatusVariant(vendor.is_active)}
              />
            }
          />
          <DetailRow label="Created At" value={new Date(vendor.created_at).toLocaleString()} />
          <DetailRow label="Updated At" value={new Date(vendor.updated_at).toLocaleString()} />
        </DetailCard>

        {(!id || (id && parseInt(id) === user?.id)) && (
          <div>
            <h3 className="text-lg font-semibold mb-4">FCM Tokens</h3>
            <DataTable columns={fcmColumns} data={fcmTokens} emptyMessage="No FCM tokens" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
