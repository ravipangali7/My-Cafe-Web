import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, QrCode, Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard, DetailRow } from '@/components/ui/detail-card';
import { StatusBadge, getActiveStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FcmToken {
  id: number;
  token: string;
  created_at: string;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  expire_date: string | null;
  token: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function VendorView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [fcmTokens, setFcmTokens] = useState<FcmToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      let response;
      // If id exists in params and user is superuser, fetch that vendor
      // If id matches logged-in user, use auth endpoint
      // If no id, use auth endpoint (own profile)
      if (id && user.is_superuser && parseInt(id) !== user.id) {
        // Superuser viewing another vendor
        response = await api.get<{ vendor: Vendor }>(`/api/vendors/${id}/`);
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.vendor);
      } else if (id && parseInt(id) === user.id) {
        // Viewing own profile with id in URL
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else if (!id) {
        // No id, viewing own profile
        response = await api.get<{ user: Vendor }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch vendor profile');
          navigate('/vendors');
          setLoading(false);
          return;
        }
        setVendor(response.data.user);
      } else {
        // Regular user trying to view another vendor - not allowed
        toast.error('You can only view your own profile');
        navigate('/vendors');
        setLoading(false);
        return;
      }
    } catch (error) {
      toast.error('Failed to fetch vendor profile');
      navigate('/vendors');
    }
    setLoading(false);
  }, [user, id, navigate]);

  const fetchFcmTokens = useCallback(async () => {
    if (!user) return;
    
    // Only fetch FCM tokens when viewing own profile
    const viewingOwnProfile = !id || (id && parseInt(id) === user.id);
    if (!viewingOwnProfile) {
      setFcmTokens([]);
      return;
    }
    
    const response = await api.get<{ fcm_tokens: FcmToken[] }>('/api/auth/user/fcm-tokens/');
    if (response.error) {
      toast.error('Failed to fetch FCM tokens');
    } else if (response.data) {
      setFcmTokens(response.data.fcm_tokens);
    }
  }, [user, id]);

  useEffect(() => {
    if (user) {
      fetchVendor();
      fetchFcmTokens();
    }
  }, [user, id, fetchVendor, fetchFcmTokens]);

  if (loading || !vendor) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/vendors" />
      </DashboardLayout>
    );
  }

  const fcmColumns = [
    {
      key: 'token',
      label: 'Token',
      render: (item: FcmToken) => item.token.slice(0, 30) + '...',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item: FcmToken) => new Date(item.created_at).toLocaleString(),
    },
  ];

  const menuUrl = `${window.location.origin}/menu/${vendor?.phone}`;

  const handleDownloadQR = async () => {
    if (!qrCodeRef.current) return;

    try {
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-code-${vendor?.phone || 'menu'}.png`;
      link.href = url;
      link.click();
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  // Helper function to convert image URL to data URL
  const imageUrlToDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
    if (!vendor || !qrCodeRef.current) return;

    try {
      // Capture the entire QR code container (includes logo, name, QR code, and My Cafe text)
      const qrContainer = qrCodeRef.current;
      
      // Wait a bit to ensure all images are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(qrContainer, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the image while maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      // Fit to page with margins
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      let pdfWidth = maxWidth;
      let pdfHeight = maxWidth / ratio;
      
      if (pdfHeight > maxHeight) {
        pdfHeight = maxHeight;
        pdfWidth = maxHeight * ratio;
      }
      
      // Center the image on the page
      const xPos = (pageWidth - pdfWidth) / 2;
      const yPos = (pageHeight - pdfHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, pdfWidth, pdfHeight);
      
      // Save PDF
      pdf.save(`qr-code-${vendor.phone || 'menu'}.pdf`);
      toast.success('QR code PDF downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={vendor.name}
        backLink="/vendors"
        action={
          <div className="flex gap-2">
            {(!id || (id && parseInt(id) === user?.id)) && (
              <Button variant="outline" onClick={() => setQrModalOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR
              </Button>
            )}
            {(user?.is_superuser || !id || (id && parseInt(id) === user?.id)) && (
              <Button variant="outline" onClick={() => navigate(id ? `/vendors/${id}/edit` : '/vendors/edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <DetailCard title="Vendor Details">
          {vendor.logo_url && (
            <DetailRow
              label="Logo"
              value={<img src={vendor.logo_url} alt={vendor.name} className="h-16 w-16 rounded-full object-cover" />}
            />
          )}
          <DetailRow label="Name" value={vendor.name} />
          <DetailRow label="Phone" value={vendor.phone} />
          <DetailRow
            label="Expire Date"
            value={vendor.expire_date ? new Date(vendor.expire_date).toLocaleDateString() : '—'}
          />
          <DetailRow label="Token" value={vendor.token} />
          <DetailRow
            label="Status"
            value={
              <StatusBadge
                status={vendor.is_active ? 'Active' : 'Inactive'}
                variant={getActiveStatusVariant(vendor.is_active)}
              />
            }
          />
          <DetailRow label="Created At" value={new Date(vendor.created_at).toLocaleString()} />
          <DetailRow label="Updated At" value={new Date(vendor.updated_at).toLocaleString()} />
        </DetailCard>

        {(!id || (id && parseInt(id) === user?.id)) && (
          <div>
            <h3 className="text-lg font-semibold mb-4">FCM Tokens</h3>
            <DataTable columns={fcmColumns} data={fcmTokens} emptyMessage="No FCM tokens" />
          </div>
        )}
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the menu for {vendor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Branded QR Code Design */}
            <div ref={qrCodeRef} className="p-6 bg-white rounded-lg border-2 border-gray-200 w-full max-w-sm">
              {/* Top: Vendor Logo and Name */}
              <div className="text-center mb-4">
                {vendor.logo_url && (
                  <div className="mb-2 flex justify-center">
                    <img
                      src={vendor.logo_url}
                      alt={vendor.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-300"
                    />
                  </div>
                )}
                <p className="text-lg font-semibold text-gray-800">{vendor.name}</p>
              </div>
              
              {/* Center: QR Code (high contrast) */}
              <div className="flex justify-center mb-4" data-qr-code>
                <div className="p-2 bg-white rounded">
                  <QRCode
                    value={menuUrl}
                    size={256}
                    level="H"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
              </div>
              
              {/* Bottom: My Cafe Logo/Text */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">My Cafe</h2>
              </div>
            </div>
            
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground mb-2">Menu URL:</p>
              <p className="text-xs font-mono break-all px-4">{menuUrl}</p>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button onClick={handleDownloadPDF} className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
