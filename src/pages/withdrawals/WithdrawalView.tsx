import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, IndianRupee, User, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PremiumStatsCard, formatCurrency } from '@/components/ui/premium-stats-card';
import { ShareholderInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShareholderWithdrawal } from '@/lib/types';

interface WithdrawalDetail extends ShareholderWithdrawal {
  shareholder_details?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
    share_percentage: number;
    balance: number;
    total_withdrawal: number;
  };
}

export default function WithdrawalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchWithdrawal = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get<{ withdrawal: WithdrawalDetail }>(`/api/withdrawals/${id}/`);

      if (response.error || !response.data) {
        toast.error('Withdrawal not found');
        navigate('/withdrawals');
        return;
      }

      setWithdrawal(response.data.withdrawal);
    } catch (error) {
      toast.error('Failed to fetch withdrawal');
      navigate('/withdrawals');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchWithdrawal();
  }, [fetchWithdrawal]);

  const handleApprove = async () => {
    if (!withdrawal) return;

    const response = await api.post(`/api/withdrawals/${withdrawal.id}/approve/`);

    if (response.error) {
      toast.error(response.error);
      throw new Error(response.error);
    } else {
      toast.success('Withdrawal approved');
      fetchWithdrawal();
    }
  };

  const handleReject = async (remarks?: string) => {
    if (!withdrawal) return;

    const response = await api.post(`/api/withdrawals/${withdrawal.id}/reject/`, {
      remarks: remarks || '',
    });

    if (response.error) {
      toast.error(response.error);
      throw new Error(response.error);
    } else {
      toast.success('Withdrawal rejected');
      fetchWithdrawal();
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  if (loading || !withdrawal) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/withdrawals" />
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

  const StatusIcon = getStatusIcon(withdrawal.status);
  const shareholderInfo = withdrawal.user_info || withdrawal.shareholder_details;

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title={`Withdrawal #${withdrawal.id}`}
          backLink="/withdrawals"
        />

        <div className="space-y-6">
          {/* Amount Card with Actions */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className={`p-4 rounded-2xl ${
                  withdrawal.status === 'approved' ? 'bg-success/10' : 
                  withdrawal.status === 'pending' ? 'bg-warning/10' : 'bg-destructive/10'
                }`}>
                  <IndianRupee className={`h-10 w-10 ${
                    withdrawal.status === 'approved' ? 'text-success' : 
                    withdrawal.status === 'pending' ? 'text-warning' : 'text-destructive'
                  }`} />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Withdrawal Amount</p>
                  <p className="text-4xl font-bold text-foreground">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                    <StatusBadge status={withdrawal.status} variant={getStatusVariant(withdrawal.status)} />
                  </div>
                </div>

                {/* Action Buttons for Pending */}
                {user?.is_superuser && withdrawal.status === 'pending' && (
                  <div className="flex gap-3">
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Withdrawal Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Withdrawal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Withdrawal ID</span>
                  <span className="text-sm font-medium">#{withdrawal.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold">{formatCurrency(withdrawal.amount)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={withdrawal.status} variant={getStatusVariant(withdrawal.status)} />
                </div>
                {withdrawal.remarks && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Remarks</span>
                    <span className="text-sm font-medium text-right max-w-[200px]">{withdrawal.remarks}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">{new Date(withdrawal.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm font-medium">{new Date(withdrawal.updated_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shareholder Details */}
            {shareholderInfo && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Shareholder Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ShareholderInfoCell
                    name={shareholderInfo.name}
                    phone={shareholderInfo.phone}
                    logoUrl={shareholderInfo.logo_url}
                    percentage={shareholderInfo.share_percentage}
                    balance={shareholderInfo.balance}
                    onClick={() => navigate(`/shareholders/${shareholderInfo.id}`)}
                  />

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-accent/50 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Share %</p>
                      <p className="text-lg font-bold text-success mt-1">{shareholderInfo.share_percentage}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
                      <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(shareholderInfo.balance || 0)}</p>
                    </div>
                  </div>

                  {(withdrawal.shareholder_details?.total_withdrawal !== undefined) && (
                    <div className="mt-3 p-3 rounded-lg bg-warning/10 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Withdrawn</p>
                      <p className="text-lg font-bold text-warning mt-1">
                        {formatCurrency(withdrawal.shareholder_details.total_withdrawal)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Approve Modal */}
        <ConfirmationModal
          open={approveOpen}
          onOpenChange={setApproveOpen}
          title="Approve Withdrawal"
          description={`Are you sure you want to approve this withdrawal of ${formatCurrency(withdrawal.amount)}? The amount will be deducted from the shareholder's balance.`}
          variant="success"
          confirmLabel="Approve"
          onConfirm={handleApprove}
        />

        {/* Reject Modal */}
        <ConfirmationModal
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Reject Withdrawal"
          description={`Are you sure you want to reject this withdrawal of ${formatCurrency(withdrawal.amount)}?`}
          variant="destructive"
          confirmLabel="Reject"
          onConfirm={handleReject}
          showRemarks={true}
          remarksLabel="Reason for rejection"
          remarksPlaceholder="Enter reason for rejection (optional)"
        />
      </div>
    </DashboardLayout>
  );
}
