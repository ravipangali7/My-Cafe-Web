import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Clock, CheckCircle, XCircle, Plus, Pencil, Trash2, FileX, IndianRupee, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { PremiumStatsCards, ScrollableStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { VendorInfoCell, ShareholderInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ItemActionsModal } from '@/components/ui/item-actions-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { ShareholderWithdrawal, Shareholder } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WithdrawalStats {
  total: number;
  pending: number;
  approved: number;
  failed: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
  failed_amount: number;
}

export default function WithdrawalsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [withdrawals, setWithdrawals] = useState<ShareholderWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<WithdrawalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    failed: 0,
    total_amount: 0,
    pending_amount: 0,
    approved_amount: 0,
    failed_amount: 0,
  });
  
  // Request withdrawal dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ amount: '', remarks: '', user_id: '' });
  const [creating, setCreating] = useState(false);
  
  // Shareholders list (for superuser to create on behalf of)
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loadingShareholders, setLoadingShareholders] = useState(false);
  const [selectedShareholder, setSelectedShareholder] = useState<Shareholder | null>(null);
  
  // Approve/Reject modal
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  
  // Delete modal
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<ShareholderWithdrawal | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      if (appliedSearch) params.search = appliedSearch;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const queryString = api.buildQueryString(params);
      const response = await api.get<{
        withdrawals: ShareholderWithdrawal[];
        count: number;
        total_pages: number;
        stats: WithdrawalStats;
      }>(`/api/withdrawals/${queryString}`);

      if (response.error) {
        toast.error('Failed to fetch withdrawals');
      } else if (response.data) {
        setWithdrawals(response.data.withdrawals);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedSearch, statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Fetch shareholders for superuser dropdown
  const fetchShareholders = useCallback(async () => {
    if (!user?.is_superuser) return;
    
    setLoadingShareholders(true);
    try {
      const response = await api.get<{
        shareholders: Shareholder[];
        count: number;
      }>('/api/shareholders/?page_size=100');

      if (response.data) {
        setShareholders(response.data.shareholders);
      }
    } catch (error) {
      toast.error('Failed to fetch shareholders');
    } finally {
      setLoadingShareholders(false);
    }
  }, [user?.is_superuser]);

  // Handle opening create dialog
  const handleOpenCreateDialog = () => {
    setShowCreateDialog(true);
    setCreateForm({ amount: '', remarks: '', user_id: '' });
    setSelectedShareholder(null);
    if (user?.is_superuser) {
      fetchShareholders();
    }
  };

  // Handle shareholder selection change
  const handleShareholderChange = (shareholderId: string) => {
    setCreateForm({ ...createForm, user_id: shareholderId });
    const selected = shareholders.find(s => s.id.toString() === shareholderId);
    setSelectedShareholder(selected || null);
  };

  const handleCreateWithdrawal = async () => {
    if (!createForm.amount || parseInt(createForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (user?.is_superuser && !createForm.user_id) {
      toast.error('Please select a shareholder');
      return;
    }

    setCreating(true);
    try {
      const payload: { amount: string; remarks: string; user_id?: string } = {
        amount: createForm.amount,
        remarks: createForm.remarks,
      };
      
      if (user?.is_superuser && createForm.user_id) {
        payload.user_id = createForm.user_id;
      }

      const response = await api.post('/api/withdrawals/create/', payload);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal request created');
        setShowCreateDialog(false);
        setCreateForm({ amount: '', remarks: '', user_id: '' });
        setSelectedShareholder(null);
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to create withdrawal request');
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async () => {
    if (!approveId) return;

    const response = await api.post(`/api/withdrawals/${approveId}/approve/`);

    if (response.error) {
      toast.error(response.error);
      throw new Error(response.error);
    } else {
      toast.success('Withdrawal approved');
      fetchWithdrawals();
    }
  };

  const handleReject = async (remarks?: string) => {
    if (!rejectId) return;

    const response = await api.post(`/api/withdrawals/${rejectId}/reject/`, {
      remarks: remarks || '',
    });

    if (response.error) {
      toast.error(response.error);
      throw new Error(response.error);
    } else {
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const response = await api.delete(`/api/withdrawals/${deleteId}/delete/`);

    if (response.error) {
      toast.error(response.error);
      throw new Error(response.error);
    } else {
      toast.success('Withdrawal deleted');
      fetchWithdrawals();
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

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: ShareholderWithdrawal) => (
        <span className="font-mono font-medium">#{item.id}</span>
      ),
    },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'Shareholder',
      render: (item: ShareholderWithdrawal) => {
        if (!item.user_info) return <span className="text-muted-foreground">—</span>;
        return (
          <ShareholderInfoCell
            name={item.user_info.name}
            phone={item.user_info.phone}
            logoUrl={item.user_info.logo_url}
            percentage={item.user_info.share_percentage}
          />
        );
      },
    }] : []),
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (item: ShareholderWithdrawal) => (
        <span className="font-semibold">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: (item: ShareholderWithdrawal) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      hideOnMobile: true,
      render: (item: ShareholderWithdrawal) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Withdrawals', value: stats.total || count, icon: Wallet, variant: 'default' as const },
    { label: 'Pending', value: stats.pending || 0, icon: Clock, variant: 'warning' as const },
    { label: 'Approved', value: stats.approved || 0, icon: CheckCircle, variant: 'success' as const },
    { label: 'Failed', value: stats.failed || 0, icon: XCircle, variant: 'destructive' as const },
    { label: 'Total Amount', value: formatCurrency(stats.total_amount || 0), icon: IndianRupee, variant: 'highlight' as const },
    { label: 'Pending Amount', value: formatCurrency(stats.pending_amount || 0), icon: IndianRupee, variant: 'warning' as const },
    { label: 'Approved Amount', value: formatCurrency(stats.approved_amount || 0), icon: IndianRupee, variant: 'success' as const },
    { label: 'Failed Amount', value: formatCurrency(stats.failed_amount || 0), icon: IndianRupee, variant: 'destructive' as const },
  ];

  const renderMobileCard = (withdrawal: ShareholderWithdrawal) => (
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-mono font-medium text-foreground">#{withdrawal.id}</div>
          {withdrawal.user_info && (
            <p className="text-sm text-muted-foreground mt-1">{withdrawal.user_info.name}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-foreground">{formatCurrency(withdrawal.amount)}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(withdrawal.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={withdrawal.status} variant={getStatusVariant(withdrawal.status)} />
      </div>
      {withdrawal.remarks && (
        <MobileCardRow
          label="Remarks"
          value={<span className="truncate max-w-[150px]">{withdrawal.remarks}</span>}
          className="mt-2"
        />
      )}
    </CardContent>
  );

  const withdrawalModalActions = selectedWithdrawal
    ? [
        { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/withdrawals/${selectedWithdrawal.id}`), variant: 'view' as const },
        ...(user?.is_superuser && selectedWithdrawal.status === 'pending' ? [
          { label: 'Approve', icon: <CheckCircle className="h-4 w-4" />, onClick: () => setApproveId(selectedWithdrawal.id), variant: 'success' as const },
          { label: 'Reject', icon: <XCircle className="h-4 w-4" />, onClick: () => setRejectId(selectedWithdrawal.id), variant: 'delete' as const },
        ] : []),
      ]
    : [];

  const canRequestWithdrawal = user?.is_shareholder || user?.is_superuser;

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader 
          title="Withdrawals" 
          description="Manage shareholder withdrawal requests"
          action={canRequestWithdrawal && (
            <Button onClick={handleOpenCreateDialog} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              {user?.is_superuser ? 'Create Withdrawal' : 'Request Withdrawal'}
            </Button>
          )}
        />

        {isMobile ? (
          <ScrollableStatsCards stats={statCards} loading={loading} />
        ) : (
          <PremiumStatsCards stats={statCards} loading={loading} columns={4} />
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          placeholder="Search withdrawals..."
          additionalFilters={
            <div className="w-full sm:w-36">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                  <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <PremiumTable
          columns={columns}
          data={withdrawals}
          loading={loading}
          showSerialNumber={false}
          emptyMessage="No withdrawals found"
          emptyIcon={<FileX className="h-12 w-12 text-muted-foreground" />}
          onRowClick={(item) => navigate(`/withdrawals/${item.id}`)}
          onMobileCardClick={(item) => setSelectedWithdrawal(item)}
          actions={user?.is_superuser ? {
            onView: (item) => navigate(`/withdrawals/${item.id}`),
            custom: (item) => item.status === 'pending' ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-success hover:text-success"
                  onClick={() => setApproveId(item.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRejectId(item.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate(`/withdrawals/${item.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          } : {
            onView: (item) => navigate(`/withdrawals/${item.id}`),
          }}
          mobileCard={renderMobileCard}
        />

        {count > pageSize && (
          <div className="mt-4">
            <SimplePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

        <ItemActionsModal
          open={!!selectedWithdrawal}
          onOpenChange={(open) => !open && setSelectedWithdrawal(null)}
          title={selectedWithdrawal ? `Withdrawal #${selectedWithdrawal.id}` : ''}
          description={selectedWithdrawal ? `${formatCurrency(selectedWithdrawal.amount)} · ${selectedWithdrawal.user_info?.name ?? ''}` : undefined}
          actions={withdrawalModalActions}
        />

        {/* Create Withdrawal Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{user?.is_superuser ? 'Create Withdrawal for Shareholder' : 'Request Withdrawal'}</DialogTitle>
              <DialogDescription>
                {user?.is_superuser 
                  ? (selectedShareholder 
                      ? `${selectedShareholder.name}'s balance: ${formatCurrency(selectedShareholder.balance || 0)}`
                      : 'Select a shareholder to create a withdrawal request')
                  : `Current balance: ${formatCurrency((user as any)?.balance || 0)}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {user?.is_superuser && (
                <div className="space-y-2">
                  <Label>Select Shareholder</Label>
                  <Select 
                    value={createForm.user_id} 
                    onValueChange={handleShareholderChange}
                    disabled={loadingShareholders}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingShareholders ? "Loading shareholders..." : "Select a shareholder"} />
                    </SelectTrigger>
                    <SelectContent>
                      {shareholders.map((shareholder) => (
                        <SelectItem key={shareholder.id} value={shareholder.id.toString()}>
                          {shareholder.name} (Balance: {formatCurrency(shareholder.balance || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Textarea
                  value={createForm.remarks}
                  onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
                  placeholder="Add any notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateWithdrawal} disabled={creating || (user?.is_superuser && !createForm.user_id)}>
                {creating ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Modal */}
        <ConfirmationModal
          open={!!approveId}
          onOpenChange={(open) => !open && setApproveId(null)}
          title="Approve Withdrawal"
          description="Are you sure you want to approve this withdrawal request? The amount will be deducted from the shareholder's balance."
          variant="success"
          confirmLabel="Approve"
          onConfirm={handleApprove}
        />

        {/* Reject Modal */}
        <ConfirmationModal
          open={!!rejectId}
          onOpenChange={(open) => !open && setRejectId(null)}
          title="Reject Withdrawal"
          description="Are you sure you want to reject this withdrawal request?"
          variant="destructive"
          confirmLabel="Reject"
          onConfirm={handleReject}
          showRemarks={true}
          remarksLabel="Reason for rejection"
          remarksPlaceholder="Enter reason for rejection (optional)"
        />

        {/* Delete Modal */}
        <ConfirmationModal
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Withdrawal"
          description="Are you sure you want to delete this withdrawal request? This action cannot be undone."
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
