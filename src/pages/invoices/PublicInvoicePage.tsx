import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ArrowLeft, Store, Receipt, Image } from 'lucide-react';
import { toast } from 'sonner';
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
  product_image_url?: string | null;
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
    customer_number?: string;
    transaction_charge?: string | null;
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
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const invoiceCardRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = useCallback(async () => {
    if (!invoiceCardRef.current || !orderId) {
      toast.error('Invoice not ready');
      return;
    }
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(invoiceCardRef.current, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const imgAspect = imgW / imgH;
      const pageAspect = pageW / pageH;
      const pdfW = imgAspect >= pageAspect ? pageW : pageH * imgAspect;
      const pdfH = imgAspect >= pageAspect ? pageW / imgAspect : pageH;
      const x = (pageW - pdfW) / 2;
      const y = (pageH - pdfH) / 2;
      pdf.addImage(dataUrl, 'PNG', x, y, pdfW, pdfH);
      pdf.save(`invoice_order_${orderId}.pdf`);
      toast.success('Invoice PDF downloaded');
    } catch (err) {
      console.error('Download PDF failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }, [orderId]);

  const handleDownloadImage = useCallback(async () => {
    if (!invoiceCardRef.current || !orderId) {
      toast.error('Invoice not ready');
      return;
    }
    setDownloadingImage(true);
    try {
      const canvas = await html2canvas(invoiceCardRef.current, { scale: 2, useCORS: true });
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setDownloadingImage(false);
            toast.error('Failed to create image');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice_order_${orderId}.png`;
          link.click();
          URL.revokeObjectURL(url);
          setDownloadingImage(false);
          toast.success('Invoice image downloaded');
        },
        'image/png'
      );
    } catch (err) {
      console.error('Download image failed:', err);
      setDownloadingImage(false);
      toast.error(err instanceof Error ? err.message : 'Failed to download image');
    }
  }, [orderId]);

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
  const transactionCharge = order.transaction_charge != null ? parseFloat(order.transaction_charge) : 0;
  const total = parseFloat(order.total);
  const customerNumber = order.customer_number ?? `Order #${order.id}`;
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="invoice-page min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Invoice content card - printed as-is */}
        <div ref={invoiceCardRef} className="invoice-card bg-[var(--invoice-bg)] rounded-lg shadow-md overflow-hidden">
          {/* Header: vendor logo top-left, INVOICE prominent top-right */}
          <div className="invoice-header px-6 md:px-8 pt-6 pb-4 flex flex-row justify-between items-center gap-4">
            <div className="invoice-logo-ring flex-shrink-0">
              {vendor?.logo_url ? (
                <img
                  src={vendor.logo_url}
                  alt={vendor.name}
                  className="invoice-logo-img"
                />
              ) : (
                <div className="invoice-logo-placeholder">
                  <Store className="invoice-logo-icon" />
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <h1 className="invoice-title-main">INVOICE</h1>
              <p className="invoice-number-label">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Customer information */}
          <div className="px-6 md:px-8 pb-3">
            <div className="invoice-customer-block">
              <p className="invoice-body-text">
                <span className="invoice-heading">Customer name:</span>{' '}
                {order.customer_name || 'Customer'}
              </p>
              <p className="invoice-body-text">
                <span className="invoice-heading">Customer number:</span> {customerNumber}
              </p>
            </div>
            <div className="invoice-divider my-4" />
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

          {/* Table: IMAGE, DESCRIPTION, QTY, PRICE, TOTAL */}
          <div className="px-6 md:px-8 overflow-x-auto">
            <div className="invoice-divider mb-0" />
            <table className="invoice-table w-full">
              <thead>
                <tr>
                  <th className="invoice-th-image">Image</th>
                  <th className="text-left py-3 pr-4">Description</th>
                  <th className="text-right py-3 px-2">Qty</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 pl-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="invoice-table-row">
                    <td className="py-3 pr-2 align-middle">
                      <div className="invoice-item-image-wrap">
                        {item.product_image_url ? (
                          <img
                            src={item.product_image_url}
                            alt={item.product_name}
                            className="invoice-item-image"
                          />
                        ) : (
                          <div className="invoice-item-image-placeholder">
                            <Store className="invoice-item-image-icon" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 invoice-body-text invoice-cell-desc">
                      {item.product_name}
                      {item.variant?.unit_name && (
                        <span className="invoice-variant-text">
                          {' '}
                          ({item.variant.unit_value != null ? `${item.variant.unit_value} ` : ''}
                          {item.variant.unit_name})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right invoice-body-text">{item.quantity}</td>
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

          {/* Summary: Subtotal, Service charge, Transaction charge (if any), Total */}
          <div className="px-6 md:px-8 py-4 flex justify-end">
            <div className="w-full sm:w-56 space-y-1">
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Service Charge ({taxPercent}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              {transactionCharge > 0 && (
                <div className="flex justify-between invoice-body-text text-sm">
                  <span>Transaction charge</span>
                  <span>₹{transactionCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold invoice-body-text pt-2 text-base border-t border-[var(--invoice-accent)]">
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

        {/* Download buttons (hidden when printing) */}
        <div className="invoice-no-print flex justify-center gap-3 pt-6">
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            size="lg"
            className="min-w-[200px] bg-[#333] hover:bg-[#222] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadingPdf ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button
            onClick={handleDownloadImage}
            disabled={downloadingImage}
            size="lg"
            variant="outline"
            className="min-w-[200px] border-[#333] text-[#333] hover:bg-[#333] hover:text-white"
          >
            <Image className="h-4 w-4 mr-2" />
            {downloadingImage ? 'Downloading...' : 'Download image'}
          </Button>
        </div>
      </div>
    </div>
  );
}
