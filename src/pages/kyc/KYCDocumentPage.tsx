import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

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

export default function KYCDocumentPage() {
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

  const isImage = kyc.kyc_document_url?.match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <DashboardLayout>
      <PageHeader
        title={`KYC Document: ${kyc.name}`}
        description={getDocumentTypeLabel(kyc.kyc_document_type)}
        backLink={`/kyc-management/${id}`}
      />

      <Card>
        <CardContent className="p-4">
          {kyc.kyc_document_url ? (
            isImage ? (
              <div className="border rounded-md p-4">
                <img
                  src={kyc.kyc_document_url}
                  alt="KYC Document"
                  className="max-w-full h-auto mx-auto"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Document Preview Not Available</p>
                <Button
                  variant="outline"
                  onClick={() => window.open(kyc.kyc_document_url!, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Open Document
                </Button>
              </div>
            )
          ) : (
            <p className="text-muted-foreground text-center">No document available</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
