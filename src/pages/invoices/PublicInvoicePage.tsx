import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ArrowLeft, Store, User, Calendar, Receipt, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, getOrderStatusVariant, getPaymentStatusVariant } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface InvoiceItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
  total: string;
  variant?: {
    unit_name: string | null;
    unit_value: number;
  };
}

interface InvoiceData {
  invoice: {
    id: number;
    invoice_number: string;
    generated_at: string;
  };
  order: {
    id: number;
    status: string;
    payment_method: string;
    total: string;
    remarks: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
  };
  items: InvoiceItem[];
  vendor: {
    name: string;
    phone: string;
    address: string | null;
    logo_url: string | null;
  } | null;
  pdf_url: string | null;
}

export default function PublicInvoicePage() {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!orderId || !token) {
      setError('Invalid invoice link');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/invoices/public/${orderId}/${token}/`;
      const res = await fetch(url, { credentials: 'omit' });

      if (!res.ok) {
        if (res.status === 403) {
          setError('Invalid or expired invoice link');
        } else if (res.status === 404) {
          setError('Invoice not found');
        } else {
          setError('Failed to load invoice');
        }
        setInvoiceData(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setInvoiceData(data);
    } catch {
      setError('Failed to load invoice');
      setInvoiceData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDownload = useCallback(async () => {
    if (!orderId || !token) return;
    
    setDownloading(true);
    try {
      const url = `${API_BASE_URL}/api/invoices/public/${orderId}/${token}/download/`;
      
      // Open in new window to trigger download
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-destructive font-medium mb-4">{error || 'Invoice not found'}</p>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, order, items, vendor } = invoiceData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header with Download Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice</h1>
            <p className="text-muted-foreground text-sm">{invoice.invoice_number}</p>
          </div>
          <Button 
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              {/* Vendor Info */}
              <div className="flex items-start gap-3">
                {vendor?.logo_url ? (
                  <img 
                    src={vendor.logo_url} 
                    alt={vendor.name} 
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-lg">{vendor?.name || 'Vendor'}</h2>
                  {vendor?.phone && (
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  )}
                  {vendor?.address && (
                    <p className="text-sm text-muted-foreground">{vendor.address}</p>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                <p className="text-sm text-muted-foreground flex items-center sm:justify-end gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex gap-2 mt-2">
                  <StatusBadge 
                    status={order.status} 
                    variant={getOrderStatusVariant(order.status)} 
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Customer Info */}
            {(order.customer_name || order.customer_phone) && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Bill To</span>
                </div>
                {order.customer_name && (
                  <p className="text-foreground">{order.customer_name}</p>
                )}
                {order.customer_phone && (
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                )}
              </div>
            )}

            {/* Items Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Items</span>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Item</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Qty</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3">
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant?.unit_name && (
                            <p className="text-xs text-muted-foreground">
                              {item.variant?.unit_value != null ? `${item.variant.unit_value} ` : ''}{item.variant.unit_name}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">₹{parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant?.unit_name && (
                          <p className="text-xs text-muted-foreground">
                            {item.variant?.unit_value != null ? `${item.variant.unit_value} ` : ''}{item.variant.unit_name}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">₹{parseFloat(item.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₹{parseFloat(item.price).toFixed(2)} × {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                ₹{parseFloat(order.total).toFixed(2)}
              </span>
            </div>

            {/* Payment Method */}
            {order.payment_method && (
              <div className="text-sm text-muted-foreground">
                Payment Method: <span className="capitalize">{order.payment_method}</span>
              </div>
            )}

            {/* Remarks */}
            {order.remarks && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Remarks</p>
                <p className="text-sm text-muted-foreground">{order.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Generated on {new Date(invoice.generated_at).toLocaleString()}
        </p>

        {/* Download Invoice button at bottom */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="min-w-[200px]"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
