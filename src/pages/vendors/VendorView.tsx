import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
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
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [fcmTokens, setFcmTokens] = useState<FcmToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const response = await api.get<{ user: Vendor }>('/api/auth/user/');
    if (response.error || !response.data) {
      toast.error('Failed to fetch vendor profile');
      navigate('/vendors');
    } else {
      setVendor(response.data.user);
    }
    setLoading(false);
  }, [user, navigate]);

  const fetchFcmTokens = useCallback(async () => {
    if (!user) return;
    
    const response = await api.get<{ fcm_tokens: FcmToken[] }>('/api/auth/user/fcm-tokens/');
    if (response.error) {
      toast.error('Failed to fetch FCM tokens');
    } else if (response.data) {
      setFcmTokens(response.data.fcm_tokens);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVendor();
      fetchFcmTokens();
    }
  }, [user, fetchVendor, fetchFcmTokens]);

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

  const menuUrl = `${window.location.origin}/menu/${vendor?.phone}`;

  const handleDownloadQR = async () => {
    if (!qrCodeRef.current) return;

    try {
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-code-${vendor?.phone || 'menu'}.png`;
      link.href = url;
      link.click();
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={vendor.name}
        backLink="/vendors"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQrModalOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR
            </Button>
            <Button variant="outline" onClick={() => navigate('/vendors/edit')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <DetailCard title="Vendor Details">
          {vendor.logo_url && (
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

        <div>
          <h3 className="text-lg font-semibold mb-4">FCM Tokens</h3>
          <DataTable columns={fcmColumns} data={fcmTokens} emptyMessage="No FCM tokens" />
        </div>
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the menu for {vendor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div ref={qrCodeRef} className="p-4 bg-white rounded-lg">
              <QRCode
                value={menuUrl}
                size={256}
                level="H"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Menu URL:</p>
              <p className="text-xs font-mono break-all">{menuUrl}</p>
            </div>
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
