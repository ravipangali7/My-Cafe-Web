import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { api, isWebView } from '@/lib/api';
import { requestFileFromFlutter, filePayloadToFile, type WebViewFilePayload } from '@/lib/webview-upload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  User, 
  Upload, 
  Save, 
  LogOut,
  LayoutDashboard,
  Users,
  UserRoundSearch,
  Scale,
  FolderOpen,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  QrCode,
  MessageCircle,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Key
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, superuserOnly: false },
  { path: '/vendors', label: 'Vendors', icon: Users, superuserOnly: false },
  { path: '/units', label: 'Units', icon: Scale, superuserOnly: false },
  { path: '/categories', label: 'Categories', icon: FolderOpen, superuserOnly: false },
  { path: '/products', label: 'Products', icon: Package, superuserOnly: false },
  { path: '/customers', label: 'Customers', icon: UserRoundSearch, superuserOnly: false },
  { path: '/orders', label: 'Orders', icon: ShoppingCart, superuserOnly: false },
  { path: '/qr-stands', label: 'QR Stand Orders', icon: QrCode, superuserOnly: false },
  { path: '/transactions', label: 'Transactions', icon: Receipt, superuserOnly: false },
  { path: '/whatsapp-notifications', label: 'WhatsApp Notifications', icon: MessageCircle, superuserOnly: false },
  { path: '/reports', label: 'Reports', icon: FileText, superuserOnly: false },
  { path: '/kyc-management', label: 'KYC Management', icon: ShieldCheck, superuserOnly: true },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFilePayload, setLogoFilePayload] = useState<WebViewFilePayload | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscription_state: string;
    is_active: boolean;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    subscription_type: string | null;
  } | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Filter nav items based on superuser status
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (item.superuserOnly) {
        return user?.is_superuser === true;
      }
      return true;
    });
  }, [user?.is_superuser]);

  const handleSignOut = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    navigate('/login');
  };

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.get<{
        subscription_state: string;
        is_active: boolean;
        subscription_start_date: string | null;
        subscription_end_date: string | null;
        subscription_type: string | null;
      }>('/api/subscription/status/');
      if (response.error || !response.data) {
        // Don't show error for subscription status, it's optional
        return;
      }
      setSubscriptionStatus(response.data);
    } catch (error) {
      // Silently fail for subscription status
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setFetching(true);
      try {
        const response = await api.get<{ user: any }>('/api/auth/user/');
        if (response.error || !response.data) {
          toast.error('Failed to fetch profile');
          return;
        }
        
        const userData = response.data.user;
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setLogoPreview(userData.logo_url || null);
      } catch (error) {
        toast.error('Failed to fetch profile');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
    fetchSubscriptionStatus();
  }, [user, fetchSubscriptionStatus]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoUrl(null);
      setLogoFilePayload(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebViewLogoUpload = async () => {
    if (!isWebView()) return;
    setUploadingLogo(true);
    try {
      const payload = await requestFileFromFlutter({ accept: 'image/*', field: 'logo' });
      setLogoFilePayload(payload);
      setLogoFile(null);
      setLogoUrl(null);
      setLogoPreview(payload.dataUrl);
      toast.success('Image selected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to select image');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (logoFilePayload) {
        const file = await filePayloadToFile(logoFilePayload);
        formData.append('logo', file);
      } else if (logoUrl) {
        formData.append('logo_url', logoUrl);
      }

      const response = await api.put<{ user: any; message: string }>('/api/auth/user/update/', formData, true);
      
      if (response.error) {
        toast.error(response.error || 'Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
        // Refresh the page to update user context
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Profile"
        description={isMobile ? "Navigation and profile settings" : "Manage your profile information"}
      />

      {isMobile ? (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{name || 'No Name'}</h3>
                  <p className="text-sm text-muted-foreground">{phone || 'No Phone'}</p>
                </div>
              </div>
              
              {/* Subscription Info */}
              {subscriptionStatus && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Subscription</span>
                    {subscriptionStatus.subscription_state === 'active' ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : subscriptionStatus.subscription_state === 'expired' ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {subscriptionStatus.subscription_state === 'inactive_with_date' ? 'Inactive' : 'No Subscription'}
                      </Badge>
                    )}
                  </div>
                  {subscriptionStatus.subscription_end_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {subscriptionStatus.subscription_type === 'yearly' ? 'Yearly' : subscriptionStatus.subscription_type === 'monthly' ? 'Monthly' : ''}
                        {subscriptionStatus.subscription_type && ' • '}
                        Expires {new Date(subscriptionStatus.subscription_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link to="/profile/change-password">
                    <Key className="h-4 w-4" />
                    Change Password
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Navigation */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Feature</h2>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.path}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Logout Button */}
          <div>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleSignOut();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (isWebView()) {
                            handleWebViewLogoUpload();
                          } else {
                            document.getElementById('logo')?.click();
                          }
                        }}
                        disabled={uploadingLogo}
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingLogo ? 'Selecting...' : (logoPreview ? 'Change Image' : 'Upload Image')}
                      </Button>
                    </Label>
                    {!isWebView() && (
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      JPG, PNG or GIF. Max size 2MB
                    </p>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to="/profile/change-password">
                      <Key className="h-4 w-4" />
                      Change Password
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
