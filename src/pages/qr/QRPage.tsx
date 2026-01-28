import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MenuQRCode, MenuQRCodeVendor } from '@/components/dashboard/MenuQRCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function QRPage() {
  const { vendorPhone } = useParams<{ vendorPhone: string }>();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-4">
        <MenuQRCode vendor={vendor} menuUrl={menuUrl} blockOnly={false} />
      </div>
    </div>
  );
}
