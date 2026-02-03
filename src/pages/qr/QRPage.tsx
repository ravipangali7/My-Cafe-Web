import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MenuQRCode, MenuQRCodeVendor } from '@/components/dashboard/MenuQRCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function QRPage() {
  const { vendorPhone } = useParams<{ vendorPhone: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [vendor, setVendor] = useState<MenuQRCodeVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendor = useCallback(async () => {
    if (!vendorPhone) {
      setError('Vendor phone is required');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/public/vendor/${encodeURIComponent(vendorPhone)}/`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          setError('Vendor not found');
        } else {
          setError('Failed to load vendor');
        }
        setVendor(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const v = data.vendor;
      if (v && v.id != null && v.name != null && v.phone != null) {
        setVendor({
          id: v.id,
          name: v.name,
          phone: v.phone,
          logo_url: v.logo_url ?? null,
        });
      } else {
        setError('Invalid vendor data');
      }
    } catch {
      setError('Failed to load vendor');
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [vendorPhone]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // Lock viewport scale on mobile so QR maintains actual size (no pinch/double-tap zoom)
  useEffect(() => {
    if (!isMobile || typeof document === 'undefined') return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta || !meta.getAttribute('content')) return;
    const original = meta.getAttribute('content');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no');
    return () => {
      meta.setAttribute('content', original ?? 'width=device-width, initial-scale=1.0');
    };
  }, [isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error || 'Vendor not found'}</p>
            <Button
              variant="outline"
              className="mt-4"
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

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${vendor.phone}` : '';

  return (
    <div
      className="min-h-screen bg-background overflow-x-hidden overflow-y-auto flex flex-col items-center p-4"
      style={{
        touchAction: 'manipulation',
        maxWidth: '100vw',
        ...(isMobile && {
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
        }),
      }}
    >
      <div className="w-full max-w-sm space-y-4 flex flex-col items-center flex-shrink-0 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="self-start -ml-2 text-muted-foreground hover:text-foreground text-base"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <MenuQRCode vendor={vendor} menuUrl={menuUrl} blockOnly={false} compact={isMobile} />
      </div>
    </div>
  );
}
