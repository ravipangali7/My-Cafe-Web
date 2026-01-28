import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, QrCode, Eye } from 'lucide-react';

interface KYCRecord {
  id: number;
  name: string;
  phone: string;
  kyc_status: string;
  kyc_reject_reason: string | null;
  kyc_document_type: string | null;
  kyc_document_url: string | null;
  created_at: string;
  updated_at: string;
}

function getDocumentTypeLabel(type: string | null) {
  if (!type) return '—';
  return type === 'aadhaar' ? 'Aadhaar Card' : 'Food License';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <StatusBadge status="Approved" variant="success" />;
    case 'rejected':
      return <StatusBadge status="Rejected" variant="destructive" />;
    case 'pending':
    default:
      return <StatusBadge status="Pending" variant="warning" />;
  }
}

export default function KYCViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKYC = useCallback(async () => {
    if (!user?.is_superuser || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<{ kyc: KYCRecord }>(`/api/kyc/${id}/`);
      if (response.error || !response.data) {
        toast.error(response.error || 'Failed to load KYC');
        navigate('/kyc-management');
        return;
      }
      setKyc(response.data.kyc);
    } catch {
      toast.error('Failed to load KYC');
      navigate('/kyc-management');
    } finally {
      setLoading(false);
    }
  }, [user, id, navigate]);

  useEffect(() => {
    fetchKYC();
  }, [fetchKYC]);

  if (loading || !kyc) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/kyc-management" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`KYC: ${kyc.name}`}
        description={getDocumentTypeLabel(kyc.kyc_document_type)}
        backLink="/kyc-management"
        action={
          <div className="flex gap-2">
            {kyc.kyc_document_url && (
              <Button variant="outline" onClick={() => navigate(`/kyc-management/${id}/document`)}>
                <FileText className="h-4 w-4 mr-2" />
                Document
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/qr/${kyc.phone}`)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR View
            </Button>
          </div>
        }
      />

      <DetailCard title="KYC Details">
        <DetailRow label="Vendor Name" value={kyc.name} />
        <DetailRow label="Phone" value={kyc.phone} />
        <DetailRow label="Document Type" value={getDocumentTypeLabel(kyc.kyc_document_type)} />
        <DetailRow label="Status" value={getStatusBadge(kyc.kyc_status)} />
        <DetailRow label="Submitted" value={new Date(kyc.created_at).toLocaleString()} />
        <DetailRow label="Updated" value={new Date(kyc.updated_at).toLocaleString()} />
        {kyc.kyc_reject_reason && (
          <DetailRow
            label="Rejection Reason"
            value={<span className="text-destructive">{kyc.kyc_reject_reason}</span>}
          />
        )}
      </DetailCard>

      {kyc.kyc_document_url && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Document</p>
            <Button variant="outline" onClick={() => navigate(`/kyc-management/${id}/document`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
