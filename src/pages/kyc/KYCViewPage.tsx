import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Phone, FileText, QrCode, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DocumentPreview } from '@/components/ui/document-preview';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface KYCRecord {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  kyc_status: string;
  kyc_reject_reason: string | null;
  kyc_document_type: string | null;
  kyc_document_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function KYCViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

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

  const handleApprove = async () => {
    if (!kyc) return;

    const response = await api.post(`/api/kyc/approve/${kyc.id}/`);

    if (response.error) {
      toast.error(response.error || 'Failed to approve KYC');
      throw new Error(response.error);
    } else {
      toast.success('KYC approved successfully');
      fetchKYC();
    }
  };

  const handleReject = async (remarks?: string) => {
    if (!kyc) return;

    if (!remarks?.trim()) {
      toast.error('Please provide a rejection reason');
      throw new Error('Please provide a rejection reason');
    }

    const response = await api.post(`/api/kyc/reject/${kyc.id}/`, {
      reject_reason: remarks,
    });

    if (response.error) {
      toast.error(response.error || 'Failed to reject KYC');
      throw new Error(response.error);
    } else {
      toast.success('KYC rejected');
      fetchKYC();
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return 'No Document';
    return type === 'aadhaar' ? 'Aadhaar Card' : 'Food License';
  };

  if (loading || !kyc) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/kyc-management" />
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="h-20 w-full bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title="KYC Details"
          backLink="/kyc-management"
          action={
            <Button variant="outline" onClick={() => navigate(`/qr/${kyc.phone}`)}>
              <QrCode className="h-4 w-4 mr-2" />
              View QR
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Vendor Info Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left: Logo */}
                <div className="flex justify-center sm:justify-start">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={kyc.logo_url || undefined} alt={kyc.name} />
                    <AvatarFallback className="text-3xl font-semibold bg-accent">
                      {kyc.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Right: Details */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <span>{kyc.phone}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{kyc.name}</h2>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                    <StatusBadge status={kyc.kyc_status} variant={getStatusVariant(kyc.kyc_status)} />
                    <Badge variant="outline" className="bg-accent/50">
                      {getDocumentTypeLabel(kyc.kyc_document_type)}
                    </Badge>
                  </div>

                  {/* Action Buttons for Pending */}
                  {kyc.kyc_status === 'pending' && (
                    <div className="flex justify-center sm:justify-start gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="border-success text-success hover:bg-success/10"
                        onClick={() => setApproveOpen(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setRejectOpen(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KYC Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  KYC Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Vendor Name</span>
                  <span className="text-sm font-medium">{kyc.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{kyc.phone}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Document Type</span>
                  <span className="text-sm font-medium">{getDocumentTypeLabel(kyc.kyc_document_type)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={kyc.kyc_status} variant={getStatusVariant(kyc.kyc_status)} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-sm font-medium">{new Date(kyc.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{new Date(kyc.updated_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Document Preview */}
            <div className="space-y-6">
              <DocumentPreview
                url={kyc.kyc_document_url}
                title={getDocumentTypeLabel(kyc.kyc_document_type)}
                documentType={kyc.kyc_document_type || undefined}
              />

              {/* Rejection Reason */}
              {kyc.kyc_status === 'rejected' && kyc.kyc_reject_reason && (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Rejection Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{kyc.kyc_reject_reason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Approve Modal */}
        <ConfirmationModal
          open={approveOpen}
          onOpenChange={setApproveOpen}
          title="Approve KYC"
          description={`Are you sure you want to approve ${kyc.name}'s KYC submission? This will grant them full access to the platform.`}
          variant="success"
          confirmLabel="Approve"
          onConfirm={handleApprove}
        />

        {/* Reject Modal */}
        <ConfirmationModal
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Reject KYC"
          description={`Please provide a reason for rejecting ${kyc.name}'s KYC submission.`}
          variant="destructive"
          confirmLabel="Reject"
          onConfirm={handleReject}
          showRemarks={true}
          remarksLabel="Rejection Reason"
          remarksPlaceholder="Enter the reason for rejection..."
          remarksRequired={true}
        />
      </div>
    </DashboardLayout>
  );
}
