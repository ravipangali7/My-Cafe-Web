import { useEffect, useState, useCallback } from 'react';
import { Plus, MessageCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface UserDisplay {
  id: number;
  name: string;
  phone?: string;
}

interface WhatsAppNotificationItem {
  id: number;
  message: string;
  user: number;
  user_display: UserDisplay | null;
  created_at: string;
  updated_at: string;
  status: string;
  sent_count: number;
  total_count: number;
}

export default function WhatsAppNotificationsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<WhatsAppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (appliedSearch) params.search = appliedSearch;
      const response = await fetchPaginated<WhatsAppNotificationItem>('/api/whatsapp-notifications/', params);
      if (response.error) {
        toast.error('Failed to fetch WhatsApp notifications');
      } else if (response.data) {
        setItems(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch {
      toast.error('Failed to fetch WhatsApp notifications');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch]);

  useEffect(() => {
    if (user) fetchList();
  }, [user, fetchList]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const snippet = (msg: string, maxLen = 60) => {
    if (!msg) return '—';
    return msg.length <= maxLen ? msg : msg.slice(0, maxLen) + '…';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      sending: { label: 'Sending', variant: 'default' },
      sent: { label: 'Sent', variant: 'outline' },
      failed: { label: 'Failed', variant: 'destructive' },
    };
    const c = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const columns = [
    { key: 'message', label: 'Message', render: (item: WhatsAppNotificationItem) => snippet(item.message) },
    {
      key: 'user_display',
      label: 'Vendor',
      hideOnMobile: true,
      render: (item: WhatsAppNotificationItem) => item.user_display?.name ?? '—',
    },
    {
      key: 'recipients',
      label: 'Recipients',
      render: (item: WhatsAppNotificationItem) => `${item.sent_count}/${item.total_count}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: WhatsAppNotificationItem) => statusBadge(item.status),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: WhatsAppNotificationItem) => new Date(item.created_at).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: WhatsAppNotificationItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/whatsapp-notifications/${item.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="WhatsApp Notifications"
        description="View past WhatsApp notifications sent to customers"
      >
        <Button onClick={() => navigate('/whatsapp-notifications/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </PageHeader>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={handleApplyFilters}
        placeholder="Search by message..."
      />
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        onRowClick={(item) => navigate(`/whatsapp-notifications/${item.id}`)}
      />
      <SimplePagination
        page={page}
        totalPages={totalPages}
        count={count}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </DashboardLayout>
  );
}
