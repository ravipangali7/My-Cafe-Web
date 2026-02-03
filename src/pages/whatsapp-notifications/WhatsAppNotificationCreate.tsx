import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface VendorCustomer {
  id: number;
  name: string;
  phone: string;
  user: number;
  created_at: string;
  updated_at: string;
}

interface CreateResponse {
  id: number;
  status: string;
  total_count: number;
}

interface DetailResponse {
  id: number;
  status: string;
  sent_count: number;
  total_count: number;
}

const POLL_INTERVAL_MS = 1500;

export default function WhatsAppNotificationCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [progress, setProgress] = useState<DetailResponse | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    setCustomersLoading(true);
    try {
      const res = await fetchPaginated<VendorCustomer>('/api/vendor-customers/', {
        page: 1,
        page_size: 500,
      });
      if (res.error) {
        toast.error('Failed to load customers');
      } else if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user, fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  const toggleCustomer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) setSelectedIds(new Set());
  };

  const canSubmit =
    message.trim().length > 0 &&
    (selectAll || selectedIds.size > 0) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setProgressError(null);
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      if (selectAll) {
        formData.append('select_all', 'true');
      } else {
        formData.append('customer_ids', JSON.stringify(Array.from(selectedIds)));
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }
      const res = await api.post<CreateResponse>('/api/whatsapp-notifications/create/', formData, true);
      if (res.error) {
        toast.error(res.error);
        setSubmitting(false);
        return;
      }
      if (res.data?.id != null) {
        setCreatedId(res.data.id);
        setProgress({
          id: res.data.id,
          status: res.data.status,
          sent_count: 0,
          total_count: res.data.total_count,
        });
      }
    } catch {
      toast.error('Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll for progress when we have a created id
  useEffect(() => {
    if (createdId == null) return;
    const t = setInterval(async () => {
      const res = await api.get<DetailResponse>(`/api/whatsapp-notifications/${createdId}/`);
      if (res.error) {
        setProgressError(res.error);
        return;
      }
      if (res.data) {
        setProgress(res.data);
        if (res.data.status === 'sent') {
          clearInterval(t);
          toast.success('All messages sent successfully.');
          navigate('/whatsapp-notifications');
        } else if (res.data.status === 'failed') {
          clearInterval(t);
          toast.error('Some messages failed to send.');
        }
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [createdId, navigate]);

  if (createdId != null && progress) {
    const pending = Math.max(0, progress.total_count - progress.sent_count);
    return (
      <DashboardLayout>
        <PageHeader title="Sending WhatsApp Notification" description="Progress" />
        <Card>
          <CardHeader>
            <CardTitle>Notification #{createdId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressError && (
              <p className="text-destructive text-sm">{progressError}</p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent</p>
                <p className="text-2xl font-semibold">{progress.sent_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{pending}</p>
              </div>
            </div>
            {progress.status === 'sending' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            )}
            {progress.status === 'sent' && (
              <p className="text-muted-foreground">Redirecting to list...</p>
            )}
            {progress.status === 'failed' && (
              <Button variant="outline" onClick={() => navigate('/whatsapp-notifications')}>
                Back to list
              </Button>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Create WhatsApp Notification"
        description="Send a message to selected customers via WhatsApp"
      >
        <Button variant="outline" onClick={() => navigate('/whatsapp-notifications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>
      </PageHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="message">Message (required)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-[120px] mt-2"
              required
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={(v) => handleSelectAllChange(v === true)}
              />
              <Label htmlFor="selectAll" className="cursor-pointer">Select all customers</Label>
            </div>
            {!selectAll && (
              <>
                <div>
                  <Label htmlFor="customerSearch">Search customers</Label>
                  <Input
                    id="customerSearch"
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="mt-2"
                  />
                </div>
                {customersLoading ? (
                  <p className="text-muted-foreground text-sm">Loading customers...</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No customers found. Add customers first.</p>
                ) : (
                  <div className="border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
                    {filteredCustomers.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleCustomer(c.id)}
                        />
                        <span className="flex-1">{c.name}</span>
                        <span className="text-muted-foreground text-sm">{c.phone}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!selectAll && selectedIds.size > 0 && (
                  <p className="text-sm text-muted-foreground">{selectedIds.size} customer(s) selected</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Image (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="image">Attach an image to use image marketing template</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Send WhatsApp Notification'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/whatsapp-notifications')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
