import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ArrowLeft, Store, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import './PublicInvoicePage.css';

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
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="invoice-page min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse invoice-body-text">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="invoice-page min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-[#333]" />
            <p className="text-destructive font-medium mb-4">{error || 'Invoice not found'}</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, order, items, vendor } = invoiceData;
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.total), 0);
  const taxPercent = 0;
  const taxAmount = 0;
  const total = parseFloat(order.total);
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="invoice-page min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Download button - top right */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="bg-[#333] hover:bg-[#222] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>

        {/* Invoice content card */}
        <div className="bg-[#F8F7F2] rounded-sm shadow-sm overflow-hidden">
          {/* Header: centered logo + Invoice title */}
          <div className="pt-8 pb-4 flex flex-col items-center">
            <div className="invoice-logo-ring mb-4">
              {vendor?.logo_url ? (
                <img
                  src={vendor.logo_url}
                  alt={vendor.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#cc9999]/20 flex items-center justify-center">
                  <Store className="w-10 h-10 text-[#cc9999]" />
                </div>
              )}
            </div>
            {vendor?.name && (
              <div className="invoice-logo-banner mb-3">
                {vendor.name.toUpperCase()}
              </div>
            )}
            <h1 className="invoice-title">Invoice</h1>
            <p className="text-xs invoice-body-text mt-1">{invoice.invoice_number}</p>
          </div>

          {/* INVOICE FROM | INVOICE TO */}
          <div className="px-6 md:px-8 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="invoice-heading mb-2">Invoice from</p>
                <p className="font-semibold invoice-body-text">{vendor?.name || 'Vendor'}</p>
                {vendor?.phone && (
                  <p className="invoice-body-text text-sm">{vendor.phone}</p>
                )}
                {vendor?.address && (
                  <p className="invoice-body-text text-sm">{vendor.address}</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="invoice-heading mb-2">Invoice to</p>
                <p className="font-semibold invoice-body-text">
                  {order.customer_name || 'Customer'}
                </p>
                {order.customer_phone && (
                  <p className="invoice-body-text text-sm">{order.customer_phone}</p>
                )}
                <p className="invoice-body-text text-sm">
                  {order.customer_name || order.customer_phone ? '—' : ''}
                </p>
              </div>
            </div>
            <div className="invoice-divider my-4" />
          </div>

          {/* Table: DESCRIPTION, QTY, PRICE, TOTAL */}
          <div className="px-6 md:px-8">
            <div className="invoice-divider mb-0" />
            <table className="invoice-table w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 pr-4">Description</th>
                  <th className="text-right py-3 px-2">Qty</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 pl-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[#e8e6e0]">
                    <td className="py-3 pr-4 invoice-body-text">
                      {item.product_name}
                      {item.variant?.unit_name && (
                        <span className="text-[#666]">
                          {' '}
                          ({item.variant.unit_value != null ? `${item.variant.unit_value} ` : ''}
                          {item.variant.unit_name})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right invoice-body-text">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 text-right invoice-body-text">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </td>
                    <td className="py-3 pl-4 text-right invoice-body-text">
                      ₹{parseFloat(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-divider mt-0" />
          </div>

          {/* Summary: Subtotal, Tax, Total */}
          <div className="px-6 md:px-8 py-4 flex justify-end">
            <div className="w-full sm:w-56 space-y-1">
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Tax ({taxPercent}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold invoice-body-text pt-2 text-base border-t border-[#cc9999]">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS | PAYMENT METHOD */}
          <div className="invoice-divider mx-6 md:mx-8" />
          <div className="px-6 md:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="invoice-heading mb-2">Terms &amp; conditions</p>
              <p className="invoice-body-text text-sm">
                {order.remarks || 'Thank you for your order.'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="invoice-heading mb-2">Payment method</p>
              <p className="invoice-body-text text-sm">
                {order.payment_method ? (
                  <>
                    Payment: {order.payment_method}
                    <br />
                    Date: {orderDate}
                  </>
                ) : (
                  `Date: ${orderDate}`
                )}
              </p>
            </div>
          </div>

          {/* Footer band - olive green */}
          <div className="invoice-footer-band mt-6" />
        </div>

        {/* Secondary download button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="min-w-[200px] bg-[#333] hover:bg-[#222] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
