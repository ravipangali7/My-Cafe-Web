import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { api, isWebView } from '@/lib/api';
import { requestFileFromFlutter, filePayloadToFile, type WebViewFilePayload } from '@/lib/webview-upload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function slugFromName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
    .replace(/^-+|-+$/g, '') || '';
}

type UsernameCheckStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function VendorForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const isCreateMode = !id || id === 'new';
  const isEditMode = !isCreateMode;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<UsernameCheckStatus>('idle');
  const [usernameSuggestion, setUsernameSuggestion] = useState<string | null>(null);
  const usernameCheckAbortRef = useRef<AbortController | null>(null);
  const lastSuggestedSlugRef = useRef<string>('');
  const userHasEditedUsernameRef = useRef(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFilePayload, setLogoFilePayload] = useState<WebViewFilePayload | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [expireDate, setExpireDate] = useState('');
  const [token, setToken] = useState('');
  const [ugApi, setUgApi] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVendor = useCallback(async () => {
    if (!user || isCreateMode) return;
    
    // If editing own profile, use user endpoint
    if (parseInt(id || '0') === user.id) {
      const response = await api.get<{ user: any }>('/api/auth/user/');
      if (response.error || !response.data) {
        toast.error('Failed to fetch vendor profile');
        navigate('/vendors');
        return;
      }
      const vendorData = response.data.user;
      setName(vendorData.name || '');
      setUsername(vendorData.username || '');
      setPhone(vendorData.phone || '');
      setEmail(vendorData.email || '');
      setLogoPreview(vendorData.logo_url || null);
      setExpireDate(vendorData.expire_date || '');
      setToken(vendorData.token || '');
      setUgApi(vendorData.ug_api ?? '');
      setIsActive(vendorData.is_active ?? true);
      setIsSuperuser(vendorData.is_superuser ?? false);
      userHasEditedUsernameRef.current = false;
    } else if (user.is_superuser) {
      // Superuser editing another vendor
      const response = await api.get<{ vendor: any }>(`/api/vendors/${id}/`);
      if (response.error || !response.data) {
        toast.error('Failed to fetch vendor');
        navigate('/vendors');
        return;
      }
      const vendorData = response.data.vendor;
      setName(vendorData.name || '');
      setUsername(vendorData.username || '');
      setPhone(vendorData.phone || '');
      setEmail(vendorData.email || '');
      setLogoPreview(vendorData.logo_url || null);
      setExpireDate(vendorData.expire_date || '');
      setToken(vendorData.token || '');
      setUgApi(vendorData.ug_api ?? '');
      setIsActive(vendorData.is_active ?? true);
      setIsSuperuser(vendorData.is_superuser ?? false);
      userHasEditedUsernameRef.current = false;
    } else {
      navigate('/vendors');
    }
  }, [user, id, isCreateMode, navigate]);

  // Auto-suggest username from name (create mode only; when user hasn't manually edited username)
  useEffect(() => {
    if (!isCreateMode) return;
    const slug = slugFromName(name);
    if (!slug) return;
    if (!userHasEditedUsernameRef.current && (username === '' || username === lastSuggestedSlugRef.current)) {
      lastSuggestedSlugRef.current = slug;
      setUsername(slug);
      setUsernameCheckStatus('idle');
      setUsernameSuggestion(null);
    }
  }, [name, isCreateMode, username]);

  // Live username availability check (debounced)
  useEffect(() => {
    const value = username.trim().toLowerCase();
    if (!value) {
      setUsernameCheckStatus('idle');
      setUsernameSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      if (usernameCheckAbortRef.current) {
        usernameCheckAbortRef.current.abort();
      }
      usernameCheckAbortRef.current = new AbortController();
      setUsernameCheckStatus('checking');
      setUsernameSuggestion(null);
      try {
        const excludeParam = isEditMode && id ? `&exclude_user_id=${id}` : '';
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/vendors/check-username/?username=${encodeURIComponent(value)}${excludeParam}`,
          { credentials: 'include', signal: usernameCheckAbortRef.current.signal }
        );
        const data = await res.json();
        if (data.available) {
          setUsernameCheckStatus('available');
          setUsernameSuggestion(null);
        } else {
          setUsernameCheckStatus('taken');
          setUsernameSuggestion(data.suggestion || null);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setUsernameCheckStatus('idle');
        setUsernameSuggestion(null);
      } finally {
        usernameCheckAbortRef.current = null;
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      if (usernameCheckAbortRef.current) {
        usernameCheckAbortRef.current.abort();
      }
    };
  }, [username, isEditMode, id]);

  useEffect(() => {
    if (user) {
      if (isCreateMode) {
        // Only superusers can create vendors
        if (!user.is_superuser) {
          toast.error('Only superusers can create vendors');
          navigate('/vendors');
        }
      } else {
        fetchVendor();
      }
    }
  }, [user, isCreateMode, fetchVendor, navigate]);

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
      if (isCreateMode) {
        // Create new vendor
        if (!user.is_superuser) {
          toast.error('Only superusers can create vendors');
          return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('username', username.trim());
        formData.append('phone', phone);
        formData.append('password', password);
        if (email) {
          formData.append('email', email);
        }
        if (logoFile) {
          formData.append('logo', logoFile);
        } else if (logoFilePayload) {
          const file = await filePayloadToFile(logoFilePayload);
          formData.append('logo', file);
        } else if (logoUrl) {
          formData.append('logo_url', logoUrl);
        }
        if (expireDate) {
          formData.append('expire_date', expireDate);
        }
        if (token) {
          formData.append('token', token);
        }
        formData.append('is_superuser', isSuperuser.toString());

        const response = await api.post<{ vendor: any; message: string }>('/api/vendors/create/', formData, true);

        if (response.error) {
          toast.error(response.error || 'Failed to create vendor');
        } else {
          toast.success('Vendor created successfully');
          navigate('/vendors');
        }
      } else {
        // Update existing vendor
        const formData = new FormData();
        formData.append('name', name);
        formData.append('username', username.trim());
        formData.append('phone', phone);
        if (password) {
          formData.append('password', password);
        }
        if (email) {
          formData.append('email', email);
        }
        if (logoFile) {
          formData.append('logo', logoFile);
        } else if (logoFilePayload) {
          const file = await filePayloadToFile(logoFilePayload);
          formData.append('logo', file);
        } else if (logoUrl) {
          formData.append('logo_url', logoUrl);
        }
        // Only send expire_date, token, ug_api if superuser or creating
        if (isCreateMode || user.is_superuser) {
          if (expireDate) {
            formData.append('expire_date', expireDate);
          }
          if (token) {
            formData.append('token', token);
          }
        }
        if (ugApi !== undefined && ugApi !== null) {
          formData.append('ug_api', ugApi);
        }
        
        // Only superusers can change is_superuser
        if (user.is_superuser && parseInt(id || '0') !== user.id) {
          formData.append('is_superuser', isSuperuser.toString());
        }

        // Determine which endpoint to use
        if (parseInt(id || '0') === user.id) {
          // Editing own profile
          const response = await api.put<{ user: any; message: string }>('/api/auth/user/update/', formData, true);
          if (response.error) {
            toast.error(response.error || 'Failed to update vendor profile');
          } else {
            toast.success('Vendor profile updated');
            navigate('/vendors');
          }
        } else if (user.is_superuser) {
          // Superuser editing another vendor
          const response = await api.put<{ vendor: any; message: string }>(`/api/vendors/${id}/edit/`, formData, true);
          if (response.error) {
            toast.error(response.error || 'Failed to update vendor');
          } else {
            toast.success('Vendor updated successfully');
            navigate('/vendors');
          }
        } else {
          toast.error('You can only edit your own profile');
        }
      }
    } catch (error) {
      toast.error(isCreateMode ? 'Failed to create vendor' : 'Failed to update vendor');
    } finally {
      setLoading(false);
    }
  };

  const canEditSuperuser = user?.is_superuser && (isCreateMode || (isEditMode && parseInt(id || '0') !== user.id));

  return (
    <DashboardLayout>
      <PageHeader 
        title={isCreateMode ? "Create Vendor" : "Edit Vendor Profile"} 
        backLink="/vendors" 
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{isCreateMode ? "Create New Vendor" : "Update Vendor Profile"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cafe Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  userHasEditedUsernameRef.current = true;
                  setUsername(e.target.value);
                }}
                placeholder="my-cafe"
                required
              />
              {username.trim() && (
                <p className="text-xs text-muted-foreground">
                  {usernameCheckStatus === 'checking' && 'Checking...'}
                  {usernameCheckStatus === 'available' && 'Available'}
                  {usernameCheckStatus === 'taken' && (
                    <>
                      Taken.
                      {usernameSuggestion && (
                        <>
                          {' '}
                          <button
                            type="button"
                            className="underline hover:no-underline"
                            onClick={() => {
                              setUsername(usernameSuggestion);
                              setUsernameSuggestion(null);
                              setUsernameCheckStatus('idle');
                            }}
                          >
                            Use {usernameSuggestion}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                required
              />
            </div>
            {isCreateMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </>
            )}
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="password">New Password (optional, leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo (optional)</Label>
              {isWebView() ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleWebViewLogoUpload}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Selecting...' : (logoPreview ? 'Change Image' : 'Upload Image')}
                </Button>
              ) : (
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              )}
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-full object-cover" />
                </div>
              )}
            </div>
            {(isCreateMode || user?.is_superuser) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="expireDate">Expire Date (optional)</Label>
                  <Input
                    id="expireDate"
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Token (optional)</Label>
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="API Token"
                  />
                </div>
              </>
            )}
            {isEditMode && (parseInt(id || '0') === user?.id || user?.is_superuser) && (
              <div className="space-y-2">
                <Label htmlFor="ugApi">UG API (optional)</Label>
                <Input
                  id="ugApi"
                  value={ugApi}
                  onChange={(e) => setUgApi(e.target.value)}
                  placeholder="Payment UG API key"
                />
              </div>
            )}
            {canEditSuperuser && (
              <div className="flex items-center gap-2">
                <Switch id="isSuperuser" checked={isSuperuser} onCheckedChange={setIsSuperuser} />
                <Label htmlFor="isSuperuser">Superuser</Label>
              </div>
            )}
            {isEditMode && !canEditSuperuser && user?.is_superuser && (
              <div className="text-sm text-muted-foreground">
                Superuser status: {isSuperuser ? 'Yes' : 'No'} (cannot change your own status)
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !username.trim() ||
                  usernameCheckStatus === 'checking' ||
                  (username.trim() && usernameCheckStatus === 'taken')
                }
              >
                {loading ? 'Saving...' : isCreateMode ? 'Create Vendor' : 'Update Profile'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/vendors')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
