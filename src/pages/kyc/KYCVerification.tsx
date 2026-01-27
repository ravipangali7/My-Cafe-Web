import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface KYCStatus {
  kyc_status: string;
  kyc_reject_reason: string | null;
  kyc_document_type: string | null;
  user: {
    id: number;
    name: string;
    phone: string;
    kyc_status: string;
    kyc_reject_reason: string | null;
    kyc_document_type: string | null;
    kyc_document_url: string | null;
  };
}

export default function KYCVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  const fetchKYCStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<KYCStatus>('/api/kyc/status/');
      if (response.error) {
        setFetchError(response.error);
        // Don't show toast here - we'll show it in the UI
        setLoading(false);
        return;
      }

      if (response.data) {
        setKycStatus(response.data);
        setFetchError(null);
        if (response.data.user.kyc_document_type) {
          setDocumentType(response.data.user.kyc_document_type);
        }
        if (response.data.user.kyc_document_url) {
          setDocumentPreview(response.data.user.kyc_document_url);
        }
      } else {
        setFetchError('No KYC data received');
      }
    } catch (error) {
      setFetchError('Failed to fetch KYC status. Please try submitting your documents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchKYCStatus();
    }
  }, [user, fetchKYCStatus]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPEG, PNG, or PDF');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!documentFile) {
      toast.error('Please upload a document');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('kyc_document_type', documentType);
      formData.append('kyc_document_file', documentFile);

      const response = await api.post('/api/kyc/submit/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.error) {
        toast.error(response.error || 'Failed to submit KYC documents');
      } else {
        toast.success('KYC documents submitted successfully. Waiting for approval.');
        setFetchError(null);
        await fetchKYCStatus();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit KYC documents');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="Approved" variant="success" />;
      case 'rejected':
        return <StatusBadge status="Rejected" variant="destructive" />;
      case 'pending':
      default:
        return <StatusBadge status="Pending" variant="warning" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // If KYC is approved, redirect to dashboard
  if (kycStatus?.kyc_status === 'approved') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>KYC Verification</CardTitle>
            <CardDescription>
              Please submit your KYC documents to access the vendor dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error message if fetch failed */}
            {fetchError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Error Loading KYC Status</p>
                    <p className="text-sm text-muted-foreground">{fetchError}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can still submit your KYC documents below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Status */}
            {kycStatus && (
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(kycStatus.kyc_status)}
                </div>
                {kycStatus.kyc_status === 'rejected' && kycStatus.kyc_reject_reason && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive">Rejection Reason:</p>
                        <p className="text-sm text-muted-foreground">{kycStatus.kyc_reject_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
                {kycStatus.kyc_status === 'pending' && (
                  <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-semibold text-warning">Pending Review</p>
                        <p className="text-sm text-muted-foreground">
                          Your KYC documents are under review. Please wait for approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Upload Form - Show if status is null, rejected, or not pending */}
            {(!kycStatus || kycStatus.kyc_status !== 'pending') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <RadioGroup value={documentType} onValueChange={setDocumentType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aadhaar" id="aadhaar" />
                      <Label htmlFor="aadhaar" className="font-normal cursor-pointer">
                        Aadhaar Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="food_license" id="food_license" />
                      <Label htmlFor="food_license" className="font-normal cursor-pointer">
                        Food License
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Upload Document</Label>
                  <Input
                    id="document"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleDocumentChange}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: JPEG, PNG, PDF (Max 5MB)
                  </p>
                </div>

                {documentPreview && (
                  <div className="space-y-2">
                    <Label>Document Preview</Label>
                    <div className="border rounded-md p-4">
                      {documentPreview.startsWith('data:image') ? (
                        <img
                          src={documentPreview}
                          alt="Document preview"
                          className="max-w-full h-auto max-h-64 mx-auto"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {documentFile?.name || 'Document uploaded'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={submitting || !documentType || !documentFile}>
                  {submitting ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit KYC Documents
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Show uploaded document if exists */}
            {kycStatus?.user.kyc_document_url && !documentPreview && (
              <div className="space-y-2">
                <Label>Uploaded Document</Label>
                <div className="border rounded-md p-4">
                  <a
                    href={kycStatus.user.kyc_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Document
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
