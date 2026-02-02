import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, CreditCard, IndianRupee, User, AlertTriangle, Phone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PremiumStatsCard, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VendorDue } from '@/lib/types';

interface DueDetail extends VendorDue {
  due_threshold?: number;
  total_transactions?: number;
  last_payment_date?: string;
}

export default function DueView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<DueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectOpen, setCollectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchDue = useCallback(async () => {
    if (!id) return;

    try {
      // First try to get from dues endpoint
      const response = await api.get<{ vendor: DueDetail }>(`/api/dues/${id}/`);

      if (response.error || !response.data) {
        // Fallback to vendors endpoint
        const vendorResponse = await api.get<{ vendor: DueDetail }>(`/api/vendors/${id}/`);
        if (vendorResponse.error || !vendorResponse.data) {
          toast.error('Vendor not found');
          navigate('/dues');
          return;
        }
        setVendor(vendorResponse.data.vendor);
      } else {
        setVendor(response.data.vendor);
      }
    } catch (error) {
      toast.error('Failed to fetch due details');
      navigate('/dues');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDue();
  }, [fetchDue]);

  const handleCollectDue = async () => {
    if (!vendor || !user?.is_superuser) return;

    if (vendor.due_balance <= 0) {
      toast.error('No dues to collect');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/api/dues/pay/', {
        vendor_id: vendor.id,
        amount: vendor.due_balance,
      });

      if (response.error) {
        toast.error(response.error);
        throw new Error(response.error);
      } else {
        toast.success('Due payment collected successfully');
        fetchDue();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to collect payment');
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!vendor) return;

    const message = encodeURIComponent(
      `Hello ${vendor.name},\n\nThis is a reminder regarding your outstanding dues of ${formatCurrency(vendor.due_balance)}.\n\nPlease clear your dues at your earliest convenience.\n\nThank you.`
    );
    
    const phone = vendor.phone.startsWith('+') ? vendor.phone : `+91${vendor.phone}`;
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  if (loading || !vendor) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/dues" />
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
          title="Due Details"
          backLink="/dues"
        />

        <div className="space-y-6">
          {/* Due Amount Card with Actions */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className={`p-4 rounded-2xl ${vendor.is_over_threshold ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                  <IndianRupee className={`h-10 w-10 ${vendor.is_over_threshold ? 'text-destructive' : 'text-warning'}`} />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Outstanding Due Amount</p>
                  <p className={`text-4xl font-bold ${vendor.is_over_threshold ? 'text-destructive' : 'text-warning'}`}>
                    {formatCurrency(vendor.due_balance)}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                    {vendor.is_over_threshold ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over Threshold
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        Outstanding
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSendWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send WhatsApp
                  </Button>
                  {user?.is_superuser && vendor.due_balance > 0 && (
                    <Button
                      onClick={() => setCollectOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Collect Due
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendor Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VendorInfoCell
                  name={vendor.name}
                  phone={vendor.phone}
                  logoUrl={vendor.logo_url}
                  size="lg"
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                />

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{vendor.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <span className="text-sm font-semibold text-success">{formatCurrency(vendor.balance)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Due Balance</span>
                    <span className={`text-sm font-semibold ${vendor.is_over_threshold ? 'text-destructive' : 'text-warning'}`}>
                      {formatCurrency(vendor.due_balance)}
                    </span>
                  </div>
                  {vendor.due_threshold && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Threshold Limit</span>
                      <span className="text-sm font-medium">{formatCurrency(vendor.due_threshold)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Due Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Due Summary
                </CardTitle>
                <CardDescription>Overview of vendor's financial status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <PremiumStatsCard
                    label="Due Amount"
                    value={formatCurrency(vendor.due_balance)}
                    icon={IndianRupee}
                    variant={vendor.is_over_threshold ? 'destructive' : 'warning'}
                  />
                  <PremiumStatsCard
                    label="Balance"
                    value={formatCurrency(vendor.balance)}
                    icon={Wallet}
                    variant="success"
                  />
                </div>

                {vendor.is_over_threshold && (
                  <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Over Threshold Warning</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This vendor has exceeded the due threshold of {formatCurrency(vendor.due_threshold || 1000)}. 
                          Consider sending a reminder or collecting the due immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {vendor.last_payment_date && (
                  <div className="mt-4 p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Payment</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(vendor.last_payment_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Collect Due Modal */}
        <ConfirmationModal
          open={collectOpen}
          onOpenChange={setCollectOpen}
          title="Collect Due Payment"
          description={`Are you sure you want to collect ${formatCurrency(vendor.due_balance)} from ${vendor.name}? This will mark the due as paid.`}
          variant="default"
          confirmLabel={`Collect ${formatCurrency(vendor.due_balance)}`}
          onConfirm={handleCollectDue}
          loading={processing}
        />
      </div>
    </DashboardLayout>
  );
}
