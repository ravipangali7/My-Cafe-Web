import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  remarks: string | null;
  utr: string | null;
  vpa: string | null;
  payer_name: string | null;
  bank_id: string | null;
  created_at: string;
  updated_at: string;
  order: { id: string; name: string; phone: string; table_no: string } | null;
  vendor: { name: string; phone: string } | null;
}

export default function TransactionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ transaction: any }>(`/api/transactions/${id}/`);
    if (response.error || !response.data) {
      toast.error('Transaction not found');
      navigate('/transactions');
    } else {
      const transData = response.data.transaction;
      setTransaction({
        id: String(transData.id),
        amount: Number(transData.amount),
        status: transData.status,
        remarks: transData.remarks,
        utr: transData.utr,
        vpa: transData.vpa,
        payer_name: transData.payer_name,
        bank_id: transData.bank_id,
        created_at: transData.created_at,
        updated_at: transData.updated_at,
        order: transData.order_id ? { id: String(transData.order_id), name: '', phone: '', table_no: '' } : null,
        vendor: null,
      } as Transaction);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success' as const;
      case 'pending':
        return 'warning' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  if (loading || !transaction) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/transactions" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Transaction #${transaction.id}`}
        backLink="/transactions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailCard title="Transaction Details">
          <DetailRow label="Transaction ID" value={transaction.id} />
          <DetailRow label="Amount" value={`₹${Number(transaction.amount).toFixed(2)}`} />
          <DetailRow
            label="Status"
            value={<StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />}
          />
          <DetailRow label="UTR" value={transaction.utr} />
          <DetailRow label="VPA" value={transaction.vpa} />
          <DetailRow label="Payer Name" value={transaction.payer_name} />
          <DetailRow label="Bank ID" value={transaction.bank_id} />
          <DetailRow label="Remarks" value={transaction.remarks} />
          <DetailRow label="Created At" value={new Date(transaction.created_at).toLocaleString()} />
          <DetailRow label="Updated At" value={new Date(transaction.updated_at).toLocaleString()} />
        </DetailCard>

        <div className="space-y-6">
          <DetailCard title="Order Details">
            <DetailRow label="Order ID" value={transaction.order?.id} />
            <DetailRow label="Customer Name" value={transaction.order?.name} />
            <DetailRow label="Customer Phone" value={transaction.order?.phone} />
            <DetailRow label="Table No" value={transaction.order?.table_no} />
          </DetailCard>

          <DetailCard title="Vendor Details">
            <DetailRow label="Vendor Name" value={transaction.vendor?.name} />
            <DetailRow label="Vendor Phone" value={transaction.vendor?.phone} />
          </DetailCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
