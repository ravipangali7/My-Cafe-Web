import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, getOrderStatusVariant } from '@/components/ui/status-badge';
import { VendorInfoCell } from '@/components/ui/vendor-info-cell';
import { PremiumStatsCard, formatCurrency } from '@/components/ui/premium-stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  IndianRupee, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  MessageCircle, 
  QrCode, 
  Share2, 
  ArrowDownLeft, 
  Wallet,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { TransactionCategory, TransactionType as TxnType, TRANSACTION_CATEGORY_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionDetail {
  id: number;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  remarks: string | null;
  utr: string | null;
  vpa: string | null;
  payer_name: string | null;
  bank_id: string | null;
  transaction_type: TxnType;
  transaction_category: TransactionCategory;
  is_system: boolean;
  order_id: number | null;
  qr_stand_order_id: number | null;
  ug_order_id: number | null;
  ug_client_txn_id: string | null;
  ug_payment_url: string | null;
  ug_txn_date: string | null;
  ug_status: string | null;
  ug_remark: string | null;
  created_at: string;
  updated_at: string;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  order_info?: {
    id: number;
    name: string;
    phone: string;
    table_no: string;
    status: string;
    total: string;
  } | null;
  qr_stand_order_info?: {
    id: number;
    quantity: number;
    total_price: string;
    order_status: string;
  } | null;
  withdrawal_info?: {
    id: number;
    amount: number;
    status: string;
    user_name: string;
  } | null;
}

export default function TransactionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ transaction: TransactionDetail }>(`/api/transactions/${id}/`);
    if (response.error || !response.data) {
      toast.error('Transaction not found');
      navigate('/transactions');
    } else {
      setTransaction(response.data.transaction);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getTypeVariant = (type: TxnType): 'success' | 'destructive' => {
    return type === 'in' ? 'success' : 'destructive';
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case 'order':
        return ShoppingCart;
      case 'transaction_fee':
        return CreditCard;
      case 'subscription_fee':
        return Package;
      case 'whatsapp_usage':
        return MessageCircle;
      case 'qr_stand_order':
        return QrCode;
      case 'share_distribution':
        return Share2;
      case 'share_withdrawal':
        return ArrowDownLeft;
      case 'due_paid':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return XCircle;
      default:
        return Clock;
    }
  };

  if (loading || !transaction) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/transactions" />
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

  const CategoryIcon = getCategoryIcon(transaction.transaction_category);
  const StatusIcon = getStatusIcon(transaction.status);

  // Helper function to conditionally render detail rows
  const DetailRow = ({ label, value, show = true }: { label: string; value: React.ReactNode; show?: boolean }) => {
    if (!show || !value) return null;
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="page-transition">
        <PageHeader
          title={`Transaction #${transaction.id}`}
          backLink="/transactions"
        />

        <div className="space-y-6">
          {/* Amount Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className={`p-4 rounded-2xl ${transaction.transaction_type === 'in' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <IndianRupee className={`h-10 w-10 ${transaction.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`} />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {TRANSACTION_TYPE_LABELS[transaction.transaction_type]} Transaction
                  </p>
                  <p className={`text-4xl font-bold ${transaction.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`}>
                    {transaction.transaction_type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                    <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-xs">
                      <CategoryIcon className="h-3 w-3" />
                      <span>{TRANSACTION_CATEGORY_LABELS[transaction.transaction_category]}</span>
                    </div>
                    {transaction.is_system && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        System
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-subtle">
                <DetailRow label="Transaction ID" value={`#${transaction.id}`} />
                <DetailRow label="Status" value={
                  <StatusBadge status={transaction.status} variant={getStatusVariant(transaction.status)} />
                } />
                <DetailRow label="Type" value={
                  <StatusBadge 
                    status={TRANSACTION_TYPE_LABELS[transaction.transaction_type]} 
                    variant={getTypeVariant(transaction.transaction_type)} 
                  />
                } />
                <DetailRow label="Category" value={TRANSACTION_CATEGORY_LABELS[transaction.transaction_category]} />
                <DetailRow label="UTR" value={transaction.utr} show={!!transaction.utr} />
                <DetailRow label="VPA" value={transaction.vpa} show={!!transaction.vpa} />
                <DetailRow label="Payer Name" value={transaction.payer_name} show={!!transaction.payer_name} />
                <DetailRow label="Bank ID" value={transaction.bank_id} show={!!transaction.bank_id} />
                <DetailRow
                  label="Remarks"
                  value={transaction.remarks ? (
                    <span className="text-sm text-muted-foreground block break-words text-left">
                      {transaction.remarks}
                    </span>
                  ) : null}
                  show={!!transaction.remarks}
                />
                <DetailRow label="Created" value={new Date(transaction.created_at).toLocaleString()} />
                <DetailRow label="Updated" value={new Date(transaction.updated_at).toLocaleString()} />
              </CardContent>
            </Card>

            {/* UG Payment Gateway Details - only for superuser */}
            {user?.is_superuser && (transaction.ug_order_id || transaction.ug_client_txn_id) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Gateway Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-subtle">
                  <DetailRow label="UG Order ID" value={transaction.ug_order_id} show={!!transaction.ug_order_id} />
                  <DetailRow label="Client Txn ID" value={transaction.ug_client_txn_id} show={!!transaction.ug_client_txn_id} />
                  <DetailRow label="UG Status" value={transaction.ug_status} show={!!transaction.ug_status} />
                  <DetailRow label="UG Remark" value={transaction.ug_remark} show={!!transaction.ug_remark} />
                  <DetailRow label="Txn Date" value={transaction.ug_txn_date ? new Date(transaction.ug_txn_date).toLocaleString() : null} show={!!transaction.ug_txn_date} />
                  {transaction.ug_payment_url && (
                    <div className="pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(transaction.ug_payment_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Payment Page
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Vendor Details - Show for user transactions */}
            {transaction.user_info && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Vendor Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VendorInfoCell
                    name={transaction.user_info.name}
                    phone={transaction.user_info.phone}
                    logoUrl={transaction.user_info.logo_url}
                    size="lg"
                    onClick={() => navigate(`/vendors/${transaction.user_info!.id}`)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Order Details - Show for order transactions */}
            {transaction.order_info && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-subtle">
                  <DetailRow label="Order ID" value={
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto font-bold text-base"
                      onClick={() => navigate(`/orders/${transaction.order_info!.id}`)}
                    >
                      #{transaction.order_info.id}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  } />
                  <DetailRow label="Customer" value={transaction.order_info.name} />
                  <DetailRow label="Phone" value={transaction.order_info.phone} />
                  <DetailRow label="Table" value={transaction.order_info.table_no} show={!!transaction.order_info.table_no} />
                  <DetailRow label="Order Status" value={
                    <StatusBadge status={transaction.order_info.status} variant={getOrderStatusVariant(transaction.order_info.status)} />
                  } />
                  <DetailRow label="Order Total" value={formatCurrency(transaction.order_info.total)} />
                </CardContent>
              </Card>
            )}

            {/* QR Stand Order Details */}
            {transaction.qr_stand_order_info && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Stand Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-subtle">
                  <DetailRow label="Order ID" value={
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto font-bold text-base"
                      onClick={() => navigate(`/qr-stands/${transaction.qr_stand_order_info!.id}`)}
                    >
                      #{transaction.qr_stand_order_info.id}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  } />
                  <DetailRow label="Quantity" value={transaction.qr_stand_order_info.quantity} />
                  <DetailRow label="Total Price" value={formatCurrency(transaction.qr_stand_order_info.total_price)} />
                  <DetailRow label="Status" value={
                    <StatusBadge status={transaction.qr_stand_order_info.order_status} variant={getOrderStatusVariant(transaction.qr_stand_order_info.order_status)} />
                  } />
                </CardContent>
              </Card>
            )}

            {/* Shareholder Withdrawal Details */}
            {transaction.withdrawal_info && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownLeft className="h-5 w-5" />
                    Withdrawal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-subtle">
                  <DetailRow label="Withdrawal ID" value={`#${transaction.withdrawal_info.id}`} />
                  <DetailRow label="Shareholder" value={transaction.withdrawal_info.user_name} />
                  <DetailRow label="Amount" value={formatCurrency(transaction.withdrawal_info.amount)} />
                  <DetailRow label="Status" value={
                    <StatusBadge status={transaction.withdrawal_info.status} variant={getStatusVariant(transaction.withdrawal_info.status)} />
                  } />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
