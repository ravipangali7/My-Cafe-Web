import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Receipt } from 'lucide-react';

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your payment transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your payment transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No transactions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your payment transaction details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-sm font-medium">Date</th>
                <th className="text-left p-2 text-sm font-medium">Amount</th>
                <th className="text-left p-2 text-sm font-medium">Payment Mode</th>
                <th className="text-left p-2 text-sm font-medium">Status</th>
                <th className="text-left p-2 text-sm font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-accent/50">
                  <td className="p-2 text-sm">
                    {new Date(transaction.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-2 text-sm font-semibold">
                    ₹{parseFloat(transaction.amount).toFixed(2)}
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {getPaymentMode(transaction)}
                  </td>
                  <td className="p-2">
                    <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
                  </td>
                  <td className="p-2 text-sm text-muted-foreground max-w-xs truncate">
                    {transaction.remarks || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
