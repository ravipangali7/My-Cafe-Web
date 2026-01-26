import { useEffect, useState, useCallback } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailRow } from '@/components/ui/detail-card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SuperSetting {
  id: number;
  expire_duration_month: number;
  per_qr_stand_price: number;
  subscription_fee_per_month: number;
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const [setting, setSetting] = useState<SuperSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expireDuration, setExpireDuration] = useState('12');
  const [perQrStandPrice, setPerQrStandPrice] = useState('0');
  const [subscriptionFeePerMonth, setSubscriptionFeePerMonth] = useState('0');
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const response = await api.get<{ setting: SuperSetting | null }>('/api/settings/');
    if (response.error) {
      console.error('Error fetching settings:', response.error);
    }

    if (response.data) {
      if (response.data.setting) {
        setSetting(response.data.setting);
        setExpireDuration(String(response.data.setting.expire_duration_month));
        setPerQrStandPrice(String(response.data.setting.per_qr_stand_price || 0));
        setSubscriptionFeePerMonth(String(response.data.setting.subscription_fee_per_month || 0));
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate integer inputs
      const expireDurationInt = parseInt(expireDuration);
      const perQrStandPriceInt = parseInt(perQrStandPrice);
      const subscriptionFeeInt = parseInt(subscriptionFeePerMonth);

      if (isNaN(expireDurationInt) || expireDurationInt < 1) {
        toast.error('Expire duration must be a positive integer');
        setSaving(false);
        return;
      }

      if (isNaN(perQrStandPriceInt) || perQrStandPriceInt < 0) {
        toast.error('Per QR stand price must be a non-negative integer');
        setSaving(false);
        return;
      }

      if (isNaN(subscriptionFeeInt) || subscriptionFeeInt < 0) {
        toast.error('Subscription fee per month must be a non-negative integer');
        setSaving(false);
        return;
      }

      const response = await api.post('/api/settings/update/', {
        expire_duration_month: expireDurationInt,
        per_qr_stand_price: perQrStandPriceInt,
        subscription_fee_per_month: subscriptionFeeInt,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(setting ? 'Settings updated' : 'Settings created');
        await fetchSettings();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Settings" description="Manage application settings" />
        <div className="animate-pulse">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage application settings"
        action={
          !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Super Settings</CardTitle>
          <CardDescription>Configure system-wide settings</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expireDuration">Expire Duration (months)</Label>
                <Input
                  id="expireDuration"
                  type="number"
                  step="1"
                  value={expireDuration}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow positive integers
                    if (value === '' || /^\d+$/.test(value)) {
                      setExpireDuration(value);
                    }
                  }}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perQrStandPrice">Per QR Stand Price (₹)</Label>
                <Input
                  id="perQrStandPrice"
                  type="number"
                  step="1"
                  value={perQrStandPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow non-negative integers
                    if (value === '' || /^\d+$/.test(value)) {
                      setPerQrStandPrice(value);
                    }
                  }}
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground">Integer only, no decimals</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionFeePerMonth">Subscription Fee Per Month (₹)</Label>
                <Input
                  id="subscriptionFeePerMonth"
                  type="number"
                  step="1"
                  value={subscriptionFeePerMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow non-negative integers
                    if (value === '' || /^\d+$/.test(value)) {
                      setSubscriptionFeePerMonth(value);
                    }
                  }}
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground">Integer only, no decimals</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  if (setting) {
                    setExpireDuration(String(setting.expire_duration_month));
                    setPerQrStandPrice(String(setting.per_qr_stand_price || 0));
                    setSubscriptionFeePerMonth(String(setting.subscription_fee_per_month || 0));
                  }
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <DetailRow label="Expire Duration" value={`${setting?.expire_duration_month || 12} months`} />
              <DetailRow label="Per QR Stand Price" value={`₹${setting?.per_qr_stand_price || 0}`} />
              <DetailRow label="Subscription Fee Per Month" value={`₹${setting?.subscription_fee_per_month || 0}`} />
              {setting && (
                <>
                  <DetailRow label="Created At" value={new Date(setting.created_at).toLocaleString()} />
                  <DetailRow label="Updated At" value={new Date(setting.updated_at).toLocaleString()} />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
