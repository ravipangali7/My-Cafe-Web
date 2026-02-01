import { useEffect, useState, useCallback } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Plus, Pencil, Trash2, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShareholderWithdrawal } from '@/lib/types';
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

export default function WithdrawalsList() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<ShareholderWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, failed: 0 });
  
  // Request withdrawal dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ amount: '', remarks: '' });
  const [creating, setCreating] = useState(false);
  
  // Approve/Reject dialog
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<ShareholderWithdrawal | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Edit withdrawal dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<ShareholderWithdrawal | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', remarks: '' });
  const [updating, setUpdating] = useState(false);
  
  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingWithdrawal, setDeletingWithdrawal] = useState<ShareholderWithdrawal | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        stats: { pending: number; approved: number; failed: number };
      }>(`/api/withdrawals/${queryString}`);

      if (response.error) {
        toast.error('Failed to fetch withdrawals');
      } else if (response.data) {
        setWithdrawals(response.data.withdrawals);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        setStats(response.data.stats);
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

  const handleCreateWithdrawal = async () => {
    if (!createForm.amount || parseInt(createForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/api/withdrawals/create/', createForm);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal request created');
        setShowCreateDialog(false);
        setCreateForm({ amount: '', remarks: '' });
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to create withdrawal request');
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (withdrawal: ShareholderWithdrawal) => {
    setProcessing(true);
    try {
      const response = await api.post(`/api/withdrawals/${withdrawal.id}/approve/`);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal approved');
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const response = await api.post(`/api/withdrawals/${selectedWithdrawal.id}/reject/`, {
        remarks: rejectRemarks,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal rejected');
        setSelectedWithdrawal(null);
        setRejectRemarks('');
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenEdit = (withdrawal: ShareholderWithdrawal) => {
    setEditingWithdrawal(withdrawal);
    setEditForm({
      amount: withdrawal.amount.toString(),
      remarks: withdrawal.remarks || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateWithdrawal = async () => {
    if (!editingWithdrawal) return;
    if (!editForm.amount || parseInt(editForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put(`/api/withdrawals/${editingWithdrawal.id}/update/`, editForm);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal updated successfully');
        setShowEditDialog(false);
        setEditingWithdrawal(null);
        setEditForm({ amount: '', remarks: '' });
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to update withdrawal');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDelete = (withdrawal: ShareholderWithdrawal) => {
    setDeletingWithdrawal(withdrawal);
    setShowDeleteDialog(true);
  };

  const handleDeleteWithdrawal = async () => {
    if (!deletingWithdrawal) return;

    setDeleting(true);
    try {
      const response = await api.delete(`/api/withdrawals/${deletingWithdrawal.id}/delete/`);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Withdrawal deleted successfully');
        setShowDeleteDialog(false);
        setDeletingWithdrawal(null);
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error('Failed to delete withdrawal');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusVariant = (status: string) => {
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
      render: (item: ShareholderWithdrawal) => `#${item.id}`,
    },
    ...(user?.is_superuser ? [{
      key: 'user',
      label: 'User',
      render: (item: ShareholderWithdrawal) => {
        if (!item.user_info) return '—';
        return (
          <div className="flex items-center gap-2">
            {item.user_info.logo_url ? (
              <img src={item.user_info.logo_url} alt={item.user_info.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs">
                {item.user_info.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">{item.user_info.name}</div>
              <div className="text-xs text-muted-foreground">{item.user_info.phone}</div>
            </div>
          </div>
        );
      },
    }] : []),
    {
      key: 'amount',
      label: 'Amount',
      render: (item: ShareholderWithdrawal) => `₹${item.amount.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: ShareholderWithdrawal) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (item: ShareholderWithdrawal) => item.remarks || '—',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: ShareholderWithdrawal) => new Date(item.created_at).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: ShareholderWithdrawal) => {
        // For superusers: show approve/reject for pending withdrawals
        if (user?.is_superuser && item.status === 'pending') {
          return (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(item)}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setSelectedWithdrawal(item)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        // For shareholders: show edit/delete for their own pending withdrawals
        if (!user?.is_superuser && user?.is_shareholder && item.status === 'pending') {
          return (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleOpenEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleOpenDelete(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  const statCards = [
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-600' },
  ];

  const canRequestWithdrawal = user?.is_shareholder && !user?.is_superuser;

  return (
    <DashboardLayout>
      <PageHeader 
        title="Withdrawals" 
        description="Manage shareholder withdrawal requests"
        action={canRequestWithdrawal && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Withdrawal
          </Button>
        )}
      />

      <StatsCards stats={statCards} loading={loading} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        additionalFilters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Empty State */}
      {!loading && withdrawals.length === 0 && !appliedSearch && statusFilter === 'all' ? (
        <Card className="mt-4">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <FileX className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">No Withdrawals Yet</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {canRequestWithdrawal 
                    ? "You haven't made any withdrawal requests. Click below to request your first withdrawal."
                    : "No withdrawal requests have been made yet."
                  }
                </p>
              </div>
              {canRequestWithdrawal && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white mt-2"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Request Your First Withdrawal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-4">
            <CardContent className="p-0">
              <DataTable columns={columns} data={withdrawals} loading={loading} />
            </CardContent>
          </Card>

          <SimplePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={count}
          />
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {canRequestWithdrawal && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Create Withdrawal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Current balance: ₹{(user as any)?.balance?.toLocaleString() || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
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
            <Button onClick={handleCreateWithdrawal} disabled={creating}>
              {creating ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Withdrawal Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this withdrawal request for ₹{selectedWithdrawal?.amount.toLocaleString()}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for rejection (Optional)</Label>
              <Textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Withdrawal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Withdrawal Request</DialogTitle>
            <DialogDescription>
              Update your pending withdrawal request. Current balance: ₹{(user as any)?.balance?.toLocaleString() || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateWithdrawal} disabled={updating}>
              {updating ? 'Updating...' : 'Update Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Withdrawal Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Withdrawal Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this withdrawal request for ₹{deletingWithdrawal?.amount.toLocaleString()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteWithdrawal} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
