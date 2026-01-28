import { useRef } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface MenuQRCodeVendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
}

interface MenuQRCodeProps {
  vendor: MenuQRCodeVendor;
  menuUrl?: string;
  /** When true, only the branded QR block is rendered (no buttons). */
  blockOnly?: boolean;
}

export function MenuQRCode({
  vendor,
  menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${vendor.phone}` : '',
  blockOnly = false,
}: MenuQRCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const hasFlutterSaveFile = () => {
    if (typeof window === 'undefined') return false;
    const w = window as Window & { SaveFile?: { postMessage?: (msg: string) => void } };
    return Boolean(w?.SaveFile?.postMessage);
  };

  const sendFileToFlutter = (dataUrl: string, filename: string, mimeType: string) => {
    const w = typeof window !== 'undefined' ? (window as Window & { SaveFile?: { postMessage?: (msg: string) => void } }) : null;
    if (w?.SaveFile?.postMessage) {
      w.SaveFile.postMessage(JSON.stringify({ dataUrl, filename, mimeType }));
    }
  };

  const handleDownloadPNG = async () => {
    if (!qrCodeRef.current) return;
    const filename = `qr-code-${vendor?.phone || 'menu'}.png`;
    try {
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      if (hasFlutterSaveFile()) {
        sendFileToFlutter(dataUrl, filename, 'image/png');
        toast.success('QR code saved');
        return;
      }
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadPDF = async () => {
    if (!vendor || !qrCodeRef.current) return;
    const filename = `qr-code-${vendor.phone || 'menu'}.pdf`;
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        logging: false,
        allowTaint: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      let pdfWidth = maxWidth;
      let pdfHeight = maxWidth / ratio;
      if (pdfHeight > maxHeight) {
        pdfHeight = maxHeight;
        pdfWidth = maxHeight * ratio;
      }
      const xPos = (pageWidth - pdfWidth) / 2;
      const yPos = (pageHeight - pdfHeight) / 2;
      pdf.addImage(imgData, 'PNG', xPos, yPos, pdfWidth, pdfHeight);
      if (hasFlutterSaveFile()) {
        const dataUrl = pdf.output('datauristring');
        sendFileToFlutter(dataUrl, filename, 'application/pdf');
        toast.success('QR code PDF saved');
        return;
      }
      pdf.save(filename);
      toast.success('QR code PDF downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        ref={qrCodeRef}
        className="p-6 bg-white rounded-lg border-2 border-gray-200 w-full max-w-sm"
      >
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-gray-800">{vendor.name}</p>
        </div>
        <div className="flex justify-center mb-4 max-w-full" data-qr-code>
          <div
            className="relative bg-white rounded p-2"
            style={{ width: 256, height: 256 }}
          >
            <QRCode
              value={menuUrl}
              size={256}
              level="H"
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
            {vendor.logo_url && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded bg-white border-2 border-gray-200 shadow-sm"
                  style={{ width: 56, height: 56 }}
                >
                  <img
                    src={vendor.logo_url}
                    alt={vendor.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">My Cafe</h2>
        </div>
      </div>
      {!blockOnly && (
        <>
          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground mb-2">Menu URL:</p>
            <p className="text-xs font-mono break-all px-4">{menuUrl}</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownloadPNG} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1">
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
