import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, QrCode, Phone, MessageCircle, CreditCard, Package, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { DocumentPreview } from '@/components/ui/document-preview';
import { TimeRemaining } from '@/components/ui/time-remaining';
import { PremiumStatsCard, formatCurrency } from '@/components/ui/premium-stats-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  logo_url: string | null;
  expire_date: string | null;
  token: string | null;
  is_active: boolean;
  is_superuser: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_reject_reason: string | null;
  kyc_document_type: 'aadhaar' | 'food_license' | null;
  kyc_document_url: string | null;
  address: string;
  balance: number;
  due_balance: number;
  created_at: string;
  updated_at: string;
}

interface VendorStats {
  whatsapp_usage: number;
  transaction_fee: number;
  subscription_fee: number;
  qr_stand_orders: number;
  qr_pending_orders: number;
  total_orders: number;
  total_revenue: number;
}

export default function VendorView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      let response;
      if (id && user.is_superuser && parseInt(id) !== user.id) {
        response = await api.get<{ vendor: Vendor }>(`/api/vendors/${id}/`);
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.vendor);
      } else if (id && parseInt(id) === user.id) {
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else if (!id) {
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else {
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

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoadingStats(false);
      return;
    }

    const vendorId = id ? parseInt(id) : user.id;
    
    try {
      const response = await api.get<VendorStats>(`/api/stats/vendor/${vendorId}/`);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      // Stats might not be available, that's okay
      console.error('Failed to fetch vendor stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (user) {
      fetchVendor();
      fetchStats();
    }
  }, [user, id, fetchVendor, fetchStats]);

  if (loading || !vendor) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/vendors" />
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getKYCStatusVariant = (status: string): 'success' | 'warning' | 'destructive' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'warning';
    }
  };

  const getDocumentTypeLabel = (type: string | null): string => {
    switch (type) {
      case 'aadhaar':
        return 'Aadhaar Card';
      case 'food_license':
        return 'Food License';
      default:
        return 'Document';
    }
  };

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title={vendor.name}
          backLink="/vendors"
          action={
            <div className="flex gap-2">
              {(!id || (id && parseInt(id) === user?.id)) && (
                <Button variant="outline" onClick={() => navigate(`/qr/${vendor.phone}`)} className="touch-target">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR
                </Button>
              )}
              {(user?.is_superuser || !id || (id && parseInt(id) === user?.id)) && (
                <Button variant="outline" onClick={() => navigate(id ? `/vendors/${id}/edit` : '/vendors/edit')} className="touch-target">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          }
        />

        <div className="space-y-6">
          {/* Section 1: Vendor Overview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Vendor Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left: Logo */}
                <div className="flex justify-center sm:justify-start">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                    <AvatarImage src={vendor.logo_url || undefined} alt={vendor.name} />
                    <AvatarFallback className="bg-accent text-foreground text-3xl font-semibold">
                      {vendor.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Right: Details */}
                <div className="flex-1 space-y-4">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mb-1">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.phone}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{vendor.name}</h2>
                    {vendor.address && (
                      <p className="text-sm text-muted-foreground mt-1">{vendor.address}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Subscription Expiry</p>
                      <div className="mt-1">
                        <TimeRemaining expiryDate={vendor.expire_date} showIcon={false} />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                      <div className="mt-1">
                        <StatusBadge
                          status={vendor.is_active ? 'Active' : 'Inactive'}
                          variant={getActiveStatusVariant(vendor.is_active)}
                        />
                      </div>
                    </div>

                    <div className={cn(
                      "p-3 rounded-lg",
                      vendor.due_balance > 0 ? "bg-destructive/10" : "bg-accent/50"
                    )}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Due Amount</p>
                      <p className={cn(
                        "mt-1 text-xl font-bold",
                        vendor.due_balance > 0 ? "text-destructive" : "text-foreground"
                      )}>
                        {formatCurrency(vendor.due_balance || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: KYC Details */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">KYC Details</CardTitle>
                  <CardDescription>Verification documents and status</CardDescription>
                </div>
                <StatusBadge
                  status={vendor.kyc_status}
                  variant={getKYCStatusVariant(vendor.kyc_status)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {vendor.kyc_status === 'rejected' && vendor.kyc_reject_reason && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Rejection Reason</p>
                      <p className="text-sm text-muted-foreground mt-1">{vendor.kyc_reject_reason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentPreview
                  url={vendor.kyc_document_url}
                  title={getDocumentTypeLabel(vendor.kyc_document_type)}
                  documentType={vendor.kyc_document_type || undefined}
                />

                {/* Placeholder for second document if you add more */}
                {!vendor.kyc_document_url && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <p className="text-muted-foreground">No documents uploaded</p>
                        {(!id || (id && parseInt(id) === user?.id)) && vendor.kyc_status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate('/kyc')}
                          >
                            Upload Documents
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Vendor Statistics */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Vendor Statistics</CardTitle>
              <CardDescription>Usage and transaction summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <PremiumStatsCard
                  label="WhatsApp Usage"
                  value={stats?.whatsapp_usage || 0}
                  icon={MessageCircle}
                  variant="info"
                />
                <PremiumStatsCard
                  label="Transaction Fee"
                  value={formatCurrency(stats?.transaction_fee || 0)}
                  icon={CreditCard}
                  variant="default"
                />
                <PremiumStatsCard
                  label="Subscription Fee"
                  value={formatCurrency(stats?.subscription_fee || 0)}
                  icon={Package}
                  variant="default"
                />
                <PremiumStatsCard
                  label="QR Stand Orders"
                  value={stats?.qr_stand_orders || 0}
                  icon={QrCode}
                  variant="success"
                />
                <PremiumStatsCard
                  label="QR Pending Orders"
                  value={stats?.qr_pending_orders || 0}
                  icon={Clock}
                  variant={stats?.qr_pending_orders && stats.qr_pending_orders > 0 ? 'highlight' : 'default'}
                />
              </div>

              {/* Additional stats row */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <PremiumStatsCard
                  label="Total Orders"
                  value={stats?.total_orders || 0}
                  icon={ShoppingCart}
                  variant="default"
                />
                <PremiumStatsCard
                  label="Total Revenue"
                  value={formatCurrency(stats?.total_revenue || 0)}
                  icon={CreditCard}
                  variant="success"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vendor Token (for superusers or own profile) */}
          {vendor.token && (user?.is_superuser || !id || (id && parseInt(id) === user?.id)) && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">API Token</CardTitle>
                <CardDescription>Use this token for API authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-accent/50 font-mono text-sm break-all">
                  {vendor.token}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
