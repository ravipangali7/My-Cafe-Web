import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/filter-bar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumTable, MobileCardRow } from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { PremiumStatsCards } from '@/components/ui/premium-stats-card';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KYCItem {
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

interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function KYCManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [stats, setStats] = useState<KYCStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  
  // Approve/Reject modals
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);

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
      const response = await api.get<{
        kyc_list: KYCItem[];
        count: number;
        total_pages: number;
        stats?: KYCStats;
      }>(`/api/kyc/list/${queryString}`);
      
      if (response.error) {
        toast.error('Failed to fetch KYC list');
      } else if (response.data) {
        setKycList(response.data.kyc_list);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
        
        // Calculate stats from list if not provided
        if (response.data.stats) {
          setStats(response.data.stats);
        } else {
          const pending = response.data.kyc_list.filter(k => k.kyc_status === 'pending').length;
          const approved = response.data.kyc_list.filter(k => k.kyc_status === 'approved').length;
          const rejected = response.data.kyc_list.filter(k => k.kyc_status === 'rejected').length;
          setStats({
            total: response.data.count,
            pending,
            approved,
            rejected,
          });
        }
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

  const handleApprove = async () => {
    if (!approveId) return;

    const response = await api.post(`/api/kyc/approve/${approveId}/`);

    if (response.error) {
      toast.error(response.error || 'Failed to approve KYC');
      throw new Error(response.error);
    } else {
      toast.success('KYC approved successfully');
      fetchKYCList();
    }
  };

  const handleReject = async (remarks?: string) => {
    if (!rejectId) return;

    if (!remarks?.trim()) {
      toast.error('Please provide a rejection reason');
      throw new Error('Please provide a rejection reason');
    }

    const response = await api.post(`/api/kyc/reject/${rejectId}/`, {
      reject_reason: remarks,
    });

    if (response.error) {
      toast.error(response.error || 'Failed to reject KYC');
      throw new Error(response.error);
    } else {
      toast.success('KYC rejected');
      fetchKYCList();
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
    if (!type) return '—';
    return type === 'aadhaar' ? 'Aadhaar Card' : 'Food License';
  };

  const columns = [
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: KYCItem) => (
        <VendorInfoCell
          name={item.name}
          phone={item.phone}
          logoUrl={item.logo_url}
          size="md"
        />
      ),
    },
    {
      key: 'kyc_document_type',
      label: 'Document',
      hideOnMobile: true,
      render: (item: KYCItem) => (
        <Badge variant="outline" className="bg-accent/50">
          {getDocumentTypeLabel(item.kyc_document_type)}
        </Badge>
      ),
    },
    {
      key: 'kyc_status',
      label: 'Status',
      render: (item: KYCItem) => (
        <StatusBadge status={item.kyc_status} variant={getStatusVariant(item.kyc_status)} />
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      hideOnMobile: true,
      render: (item: KYCItem) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const statCards = [
    { label: 'Total KYC', value: stats.total, icon: Shield, variant: 'default' as const },
    { label: 'Pending', value: stats.pending, icon: Clock, variant: 'warning' as const },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, variant: 'success' as const },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, variant: 'destructive' as const },
  ];

  const renderMobileCard = (item: KYCItem, index: number) => (
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <VendorInfoCell
          name={item.name}
          phone={item.phone}
          logoUrl={item.logo_url}
          size="md"
        />
        <StatusBadge status={item.kyc_status} variant={getStatusVariant(item.kyc_status)} />
      </div>

      <div className="mt-3 space-y-1">
        <MobileCardRow
          label="Document"
          value={getDocumentTypeLabel(item.kyc_document_type)}
        />
        <MobileCardRow
          label="Submitted"
          value={new Date(item.created_at).toLocaleDateString()}
        />
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/kyc-management/${item.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {item.kyc_status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-success hover:text-success"
              onClick={(e) => {
                e.stopPropagation();
                setApproveId(item.id);
              }}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setRejectId(item.id);
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </CardContent>
  );

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

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title="KYC Management"
          description="Review and manage KYC document submissions"
        />

        <PremiumStatsCards stats={statCards} loading={loading} columns={4} />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          placeholder="Search by name or phone..."
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
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <PremiumTable
          columns={columns}
          data={kycList}
          loading={loading}
          showSerialNumber={true}
          emptyMessage="No KYC submissions found"
          emptyIcon={<Shield className="h-12 w-12 text-muted-foreground" />}
          onRowClick={(item) => navigate(`/kyc-management/${item.id}`)}
          actions={{
            onView: (item) => navigate(`/kyc-management/${item.id}`),
            custom: (item) => item.kyc_status === 'pending' ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/kyc-management/${item.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
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
                  className="h-8 w-8 text-destructive hover:text-destructive"
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
                onClick={() => navigate(`/kyc-management/${item.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
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

        {/* Approve Modal */}
        <ConfirmationModal
          open={!!approveId}
          onOpenChange={(open) => !open && setApproveId(null)}
          title="Approve KYC"
          description="Are you sure you want to approve this KYC submission? This will grant the vendor full access to the platform."
          variant="success"
          confirmLabel="Approve"
          onConfirm={handleApprove}
        />

        {/* Reject Modal */}
        <ConfirmationModal
          open={!!rejectId}
          onOpenChange={(open) => !open && setRejectId(null)}
          title="Reject KYC"
          description="Please provide a reason for rejecting this KYC submission."
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
