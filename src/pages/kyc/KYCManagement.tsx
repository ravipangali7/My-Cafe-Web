import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, fetchPaginated, PaginatedResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KYCItem {
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

interface KYCListResponse {
  kyc_list: KYCItem[];
  count: number;
  page: number;
  total_pages: number;
  page_size: number;
}

export default function KYCManagement() {
  const { user } = useAuth();
  const [kycList, setKycList] = useState<KYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  
  // Approve/Reject dialogs
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDocumentId, setViewDocumentId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchKYCList = useCallback(async () => {
    if (!user?.is_superuser) return;
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      
      if (appliedSearch) {
        params.search = appliedSearch;
      }
      
      if (appliedStatusFilter !== 'all') {
        params.status = appliedStatusFilter;
      }

      const queryString = api.buildQueryString(params);
      const response = await api.get<KYCListResponse>(`/api/kyc/list/${queryString}`);
      
      if (response.error) {
        toast.error('Failed to fetch KYC list');
      } else if (response.data) {
        setKycList(response.data.kyc_list);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch KYC list');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch, appliedStatusFilter]);

  useEffect(() => {
    if (user?.is_superuser) {
      fetchKYCList();
    }
  }, [user, fetchKYCList]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedStatusFilter(statusFilter);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setAppliedStatusFilter('all');
    setPage(1);
  };

  const handleApprove = useCallback(async () => {
    if (!approveId) return;

    setProcessing(true);
    try {
      const response = await api.post(`/api/kyc/approve/${approveId}/`);

      if (response.error) {
        toast.error(response.error || 'Failed to approve KYC');
      } else {
        toast.success('KYC approved successfully');
        setApproveId(null);
        fetchKYCList();
      }
    } catch (error) {
      toast.error('Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  }, [approveId, fetchKYCList]);

  const handleReject = useCallback(async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post(`/api/kyc/reject/${rejectId}/`, {
        reject_reason: rejectReason,
      });

      if (response.error) {
        toast.error(response.error || 'Failed to reject KYC');
      } else {
        toast.success('KYC rejected');
        setRejectId(null);
        setRejectReason('');
        fetchKYCList();
      }
    } catch (error) {
      toast.error('Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  }, [rejectId, rejectReason, fetchKYCList]);

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

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return '—';
    return type === 'aadhaar' ? 'Aadhaar Card' : 'Food License';
  };

  const columns = [
    { key: 'name', label: 'Vendor Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'kyc_document_type',
      label: 'Document Type',
      render: (item: KYCItem) => getDocumentTypeLabel(item.kyc_document_type),
    },
    {
      key: 'kyc_status',
      label: 'Status',
      render: (item: KYCItem) => getStatusBadge(item.kyc_status),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (item: KYCItem) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: KYCItem) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {item.kyc_document_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDocumentId(item.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          {item.kyc_status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => setApproveId(item.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRejectId(item.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Redirect if not superuser
  if (user && !user.is_superuser) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Access denied. Super admin only.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const selectedKYC = viewDocumentId ? kycList.find(k => k.id === viewDocumentId) : null;

  return (
    <DashboardLayout>
      <PageHeader
        title="KYC Management"
        description="Review and manage KYC document submissions"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters}>Apply</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={kycList} loading={loading} emptyMessage="No KYC submissions found" />

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={!!approveId} onOpenChange={() => !processing && setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve KYC</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this KYC submission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => !processing && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectId(null);
                setRejectReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDocumentId} onOpenChange={() => setViewDocumentId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View KYC Document</DialogTitle>
            <DialogDescription>
              {selectedKYC && (
                <>
                  {selectedKYC.name} - {getDocumentTypeLabel(selectedKYC.kyc_document_type)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedKYC?.kyc_document_url ? (
              <div className="border rounded-md p-4">
                {selectedKYC.kyc_document_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={selectedKYC.kyc_document_url}
                    alt="KYC Document"
                    className="max-w-full h-auto mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Document Preview Not Available</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedKYC.kyc_document_url!, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Open Document
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">No document available</p>
            )}
            {selectedKYC?.kyc_reject_reason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="font-semibold text-destructive mb-1">Rejection Reason:</p>
                <p className="text-sm text-muted-foreground">{selectedKYC.kyc_reject_reason}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDocumentId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
