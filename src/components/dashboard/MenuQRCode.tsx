import { useRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isWebView } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

/** Get initials from vendor name: first letter of first two words or first two chars. */
function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  const s = parts[0];
  return s.length >= 2 ? (s[0] + s[1]).toUpperCase() : s[0].toUpperCase();
}

/** Pick a consistent color from name hash (hex). */
function colorFromName(name: string): string {
  const colors = ['#1C455A', '#2E7D32', '#1565C0', '#6A1B9A', '#C62828', '#E65100', '#00695C', '#283593'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

export function MenuQRCode({
  vendor,
  menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${vendor.phone}` : '',
  blockOnly = false,
}: MenuQRCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    if (!vendor?.logo_url) {
      setLogoDataUrl(null);
      return;
    }
    let cancelled = false;
    // const loadLogo = async () => {
    //   try {
    //     const res = await fetch(vendor.logo_url!, { mode: 'cors', credentials: 'include' });
    //     if (!res.ok || cancelled) return;
    //     const blob = await res.blob();
    //     if (cancelled) return;
    //     const reader = new FileReader();
    //     reader.onloadend = () => {
    //       if (!cancelled && typeof reader.result === 'string') setLogoDataUrl(reader.result);
    //     };
    //     reader.readAsDataURL(blob);
    //   } catch {
    //     setLogoDataUrl(null);
    //   }
    // };
    // loadLogo();
    return () => { cancelled = true; };
  }, [vendor?.logo_url]);
  useEffect(() => { setLogoLoadError(false); }, [vendor?.logo_url]);

  const hasFlutterSaveFile = () => {
    if (typeof window === 'undefined') return false;
    const w = window as Window & { SaveFile?: { postMessage?: (msg: string) => void } };
    return Boolean(w?.SaveFile?.postMessage);
  };

  const openInBrowser = (url: string) => {
    const w = typeof window !== 'undefined' ? (window as Window & { OpenInBrowser?: { postMessage?: (msg: string) => void } }) : null;
    if (w?.OpenInBrowser?.postMessage) {
      w.OpenInBrowser.postMessage(url);
      toast.success('Opening in browser to download');
    } else {
      window.open(url, '_blank');
    }
  };

  const sendFileToFlutter = (dataUrl: string, filename: string, mimeType: string) => {
    const w = typeof window !== 'undefined' ? (window as Window & { SaveFile?: { postMessage?: (msg: string) => void } }) : null;
    if (w?.SaveFile?.postMessage) {
      w.SaveFile.postMessage(JSON.stringify({ dataUrl, filename, mimeType }));
    }
  };

  const handleDownloadPNG = async () => {
    if (!vendor?.phone) return;
    const url = `${API_BASE_URL}/api/qr/card/download-png/${encodeURIComponent(vendor.phone)}/`;
    if (isWebView()) {
      openInBrowser(url);
      return;
    }
    const filename = `qr-code-${vendor.phone}.png`;
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 404) toast.error('Vendor not found');
        else toast.error('Failed to download QR code');
        return;
      }
      const blob = await response.blob();
      if (hasFlutterSaveFile()) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            sendFileToFlutter(reader.result, filename, 'image/png');
            toast.success('QR code saved');
          }
        };
        reader.readAsDataURL(blob);
        return;
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadPDF = async () => {
    if (!vendor?.phone) return;
    const url = `${API_BASE_URL}/api/qr/card/download-pdf/${encodeURIComponent(vendor.phone)}/`;
    if (isWebView()) {
      openInBrowser(url);
      return;
    }
    const filename = `qr-code-${vendor.phone}.pdf`;
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 404) toast.error('Vendor not found');
        else toast.error('Failed to download PDF');
        return;
      }
      const blob = await response.blob();
      if (hasFlutterSaveFile()) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            sendFileToFlutter(reader.result, filename, 'application/pdf');
            toast.success('QR code PDF saved');
          }
        };
        reader.readAsDataURL(blob);
        return;
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('QR code PDF downloaded');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const gold = '#c9a227';
  const black = '#0a0a0a';

  /* Display: logoDataUrl for logo; design matches server-generated PNG/PDF. */
  const showLogoImage = Boolean(vendor.logo_url && logoDataUrl && !logoLoadError);
  const initials = vendor?.name ? getInitials(vendor.name) : '?';
  const fallbackBg = vendor?.name ? colorFromName(vendor.name) : gold;

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
            border: `3px solid #fff`,
            backgroundColor: black,
            overflow: 'hidden',
          }}
        >
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.name}
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: fallbackBg, fontSize: '24px' }}
            >
              {initials}
            </div>
          )}
        </div>
        {/* Title - vendor name */}
        <h1
          className="text-center font-bold uppercase tracking-wider mb-0.5"
          style={{ color: '#fff', fontSize: '22px', letterSpacing: '0.15em', marginBottom: 2 }}
        >
          {vendor?.name || 'My Cafe'}
        </h1>
        {/* Subtitle */}
        <p
          className="text-center uppercase tracking-widest text-xs mb-3"
          style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em', fontSize: 10 }}
        >
          Menu QR Code
        </p>
        {/* Scan & Order Now - call to action */}
        <p
          className="text-center font-semibold tracking-wide mb-3"
          style={{ color: gold, fontSize: 16, letterSpacing: '0.05em' }}
        >
          Scan &amp; Order Now
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
          © 2025 {vendor?.name || 'My Cafe'} | All Rights Reserved
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
              Download PNG (4×6")
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1">
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF (4×6")
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
