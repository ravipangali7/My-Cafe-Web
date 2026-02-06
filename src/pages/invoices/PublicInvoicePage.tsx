import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ArrowLeft, Store, Receipt, Image, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import './PublicInvoicePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** Fallback only for edge cases (e.g. missing vendor); API now always returns vendor.logo_url (uploaded or generated). */
const FALLBACK_LOGO_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#b8866b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
  );

interface InvoiceItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
  total: string;
  product_image_url?: string | null;
  discount_type?: string | null;
  discount_value?: string | null;
  variant?: {
    unit_name: string | null;
    unit_value: number;
  };
}

function formatDiscount(item: InvoiceItem): string {
  const t = item.discount_type;
  const v = item.discount_value;
  if (!t || v == null || v === '') return '—';
  const num = parseFloat(String(v));
  if (Number.isNaN(num)) return '—';
  if (t === 'percentage') return `${num % 1 === 0 ? num : num}%`;
  if (t === 'flat') return `₹${num.toFixed(2)}`;
  return '—';
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
  const transactionCharge = order.transaction_charge != null ? parseFloat(order.transaction_charge) : 0;
  const total = parseFloat(order.total);
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const invoiceDate = orderDate;

  return (
    <div className="invoice-page min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="invoice-no-print flex justify-start mb-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>
        {/* Invoice content card - printed as-is */}
        <div ref={invoiceCardRef} className="invoice-card bg-[var(--invoice-bg)] rounded-lg shadow-md overflow-hidden">
          {/* Header: logo + name + mobile left; vendor location right */}
          <div className="invoice-header px-6 md:px-8 pt-6 pb-4 flex flex-row items-start justify-between gap-4">
            <div className="flex flex-row items-start gap-4 min-w-0 flex-1">
              <div className="invoice-logo-ring flex-shrink-0">
                <img
                  src={vendor?.logo_url || FALLBACK_LOGO_DATA_URL}
                  alt={vendor?.name ?? 'Vendor'}
                  className="invoice-logo-img"
                />
              </div>
              <div className="invoice-header-vendor min-w-0">
                <h1 className="invoice-vendor-name text-xl font-bold" style={{ color: 'var(--invoice-text)' }}>
                  {vendor?.name ?? 'Vendor'}
                </h1>
                {vendor?.phone != null && vendor.phone !== '' && (
                  <p className="invoice-body-text text-sm mt-1">Mobile: {vendor.phone}</p>
                )}
              </div>
            </div>
            <div className="invoice-header-location flex-shrink-0 text-right text-sm invoice-body-text">
              {vendor?.address != null && vendor.address.trim() !== '' ? (
                vendor.address
              ) : (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden />
                  Location not set
                </span>
              )}
            </div>
          </div>

          {/* Thick separator */}
          <div className="invoice-divider-thick mx-6 md:mx-8" />

          {/* Invoice meta: Invoice No. left, Invoice Date right */}
          <div className="px-6 md:px-8 py-3 flex flex-row flex-wrap justify-between gap-x-4 gap-y-1 invoice-meta-row">
            <p className="invoice-body-text">
              <span className="invoice-heading">Invoice No.:</span>{' '}
              <span className="invoice-meta-highlight font-bold">{order.id}</span>
            </p>
            <p className="invoice-body-text">
              <span className="invoice-heading">Invoice Date:</span> {invoiceDate}
            </p>
          </div>

          {/* Customer information: name left, phone right */}
          <div className="px-6 md:px-8 pb-3">
            <div className="flex flex-row flex-wrap justify-between gap-x-4 gap-y-1 invoice-customer-row">
              <p className="invoice-body-text">
                <span className="invoice-heading">Customer name:</span>{' '}
                {order.customer_name ?? 'Customer'}
              </p>
              <p className="invoice-body-text">
                <span className="invoice-heading">Customer phone:</span>{' '}
                {order.customer_phone ?? '—'}
              </p>
            </div>
            <div className="invoice-divider my-4" />
          </div>

          {/* Table: Item Image | Item Name | Quantity | Price | Discount | Amount */}
          <div className="px-6 md:px-8 overflow-x-auto">
            <div className="invoice-divider mb-0" />
            <table className="invoice-table w-full">
              <thead>
                <tr>
                  <th className="invoice-th-image">Item Image</th>
                  <th className="text-left py-3 pr-4">Item Name</th>
                  <th className="text-right py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Discount</th>
                  <th className="text-right py-3 pl-4">Amount</th>
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
                    <td className="py-3 px-2 text-right invoice-body-text">
                      {formatDiscount(item)}
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

          {/* Summary: Subtotal, Service charge (fixed Rs), Total */}
          <div className="px-6 md:px-8 py-4 flex justify-end">
            <div className="w-full sm:w-56 space-y-1">
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between invoice-body-text text-sm">
                <span>Service charge</span>
                <span>₹{transactionCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold invoice-body-text pt-2 text-base border-t border-[var(--invoice-accent)] invoice-total-row">
                <span>Total amount</span>
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
