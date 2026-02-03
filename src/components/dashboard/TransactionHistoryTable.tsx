import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PremiumTable,
  MobileCardHeader,
  MobileCardContent,
  MobileCardRow,
} from '@/components/ui/premium-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Receipt, CreditCard, Calendar } from 'lucide-react';

interface Transaction {
  id: number;
  amount: string;
  status: string;
  remarks: string | null;
  utr: string | null;
  vpa: string | null;
  payer_name: string | null;
  bank_id: string | null;
  created_at: string;
}

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  loading?: boolean;
}

function truncateByWords(text: string | null, maxWords: number): string {
  if (!text || !String(text).trim()) return 'N/A';
  const words = String(text).trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '...';
}

export function TransactionHistoryTable({ transactions, loading }: TransactionHistoryTableProps) {
  const getPaymentMode = (transaction: Transaction): string => {
    if (transaction.vpa) return 'UPI';
    if (transaction.bank_id) return 'Bank Transfer';
    if (transaction.utr) return 'Other';
    return 'N/A';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (item: Transaction) => (
        <span className="text-sm">
          {new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: Transaction) => (
        <span className="font-semibold">₹{parseFloat(item.amount).toFixed(2)}</span>
      ),
    },
    {
      key: 'payment_mode',
      label: 'Payment Mode',
      hideOnMobile: true,
      render: (item: Transaction) => (
        <span className="text-sm text-muted-foreground">{getPaymentMode(item)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Transaction) => (
        <StatusBadge status={item.status} variant={getStatusVariant(item.status)} />
      ),
    },
    {
      key: 'remarks',
      label: 'Remarks',
      hideOnMobile: true,
      render: (item: Transaction) => (
        <span className="text-sm text-muted-foreground max-w-xs">
          {truncateByWords(item.remarks, 10)}
        </span>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (transaction: Transaction) => (
    <>
      <MobileCardHeader>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">₹{parseFloat(transaction.amount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
        </div>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow 
          label="Payment Mode" 
          value={getPaymentMode(transaction)} 
        />
        {transaction.remarks && (
          <MobileCardRow 
            label="Remarks" 
            value={truncateByWords(transaction.remarks, 10)} 
          />
        )}
        {transaction.payer_name && (
          <MobileCardRow 
            label="Payer" 
            value={transaction.payer_name} 
          />
        )}
      </MobileCardContent>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your payment transaction details</CardDescription>
      </CardHeader>
      <CardContent>
        <PremiumTable
          columns={columns}
          data={transactions as (Transaction & { id: number })[]}
          loading={loading}
          emptyMessage="No transactions found"
          emptyIcon={<Receipt className="h-12 w-12 text-muted-foreground/50" />}
          mobileCard={renderMobileCard}
        />
      </CardContent>
    </Card>
  );
}
