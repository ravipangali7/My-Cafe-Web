import { useRef, useState, useEffect } from 'react';
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
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!vendor?.logo_url) {
      setLogoDataUrl(null);
      return;
    }
    let cancelled = false;
    const loadLogo = async () => {
      try {
        const res = await fetch(vendor.logo_url!, { mode: 'cors', credentials: 'include' });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled && typeof reader.result === 'string') setLogoDataUrl(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch {
        setLogoDataUrl(null);
      }
    };
    loadLogo();
    return () => { cancelled = true; };
  }, [vendor?.logo_url]);

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
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
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
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#0a0a0a',
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

  const gold = '#c9a227';
  const black = '#0a0a0a';

  const DefaultLogoIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L28 20H44L30 30L34 46L24 38L14 46L18 30L4 20H20L24 4Z" fill={gold} />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        ref={qrCodeRef}
        className="rounded-xl w-full max-w-sm overflow-hidden flex flex-col items-center"
        style={{
          backgroundColor: black,
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Circular logo with gold ring */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 mb-4"
          style={{
            width: 72,
            height: 72,
            border: `3px solid ${gold}`,
            backgroundColor: black,
            overflow: 'hidden',
          }}
        >
          {vendor.logo_url ? (
            <img
              src={logoDataUrl || vendor.logo_url}
              alt={vendor.name}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <DefaultLogoIcon />
          )}
        </div>
        {/* Title */}
        <h1
          className="text-center font-bold uppercase tracking-wider mb-0.5"
          style={{ color: '#fff', fontSize: '22px', letterSpacing: '0.15em', marginBottom: 2 }}
        >
          My Cafe
        </h1>
        {/* Subtitle */}
        <p
          className="text-center uppercase tracking-widest text-xs mb-4"
          style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em', fontSize: 10 }}
        >
          Menu QR Code
        </p>
        {/* QR code with gold border */}
        <div
          className="flex justify-center items-center rounded-lg flex-shrink-0"
          style={{
            padding: 8,
            border: `3px solid ${gold}`,
            borderRadius: 8,
            backgroundColor: '#fff',
          }}
        >
          <div style={{ width: 200, height: 200 }}>
            <QRCode
              value={menuUrl}
              size={200}
              level="H"
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
        </div>
        {/* Footer */}
        <p
          className="text-center mt-4 text-xs"
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}
        >
          © 2025 My Cafe | All Rights Reserved
        </p>
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
