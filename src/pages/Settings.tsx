import { useEffect, useState, useCallback } from 'react';
import { Edit, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DetailRow } from '@/components/ui/detail-card';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SuperSetting } from '@/lib/types';

export default function Settings() {
  const [setting, setSetting] = useState<SuperSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expireDuration, setExpireDuration] = useState('12');
  const [perQrStandPrice, setPerQrStandPrice] = useState('0');
  const [subscriptionFeePerMonth, setSubscriptionFeePerMonth] = useState('0');
  // New fields
  const [perTransactionFee, setPerTransactionFee] = useState('10');
  const [isSubscriptionFee, setIsSubscriptionFee] = useState(true);
  const [dueThreshold, setDueThreshold] = useState('1000');
  const [isWhatsappUsage, setIsWhatsappUsage] = useState(true);
  const [whatsappPerUsage, setWhatsappPerUsage] = useState('0');
  const [shareDistributionDay, setShareDistributionDay] = useState('7');
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const response = await api.get<{ setting: SuperSetting | null }>('/api/settings/');
    if (response.error) {
      console.error('Error fetching settings:', response.error);
    }

    if (response.data) {
      if (response.data.setting) {
        const s = response.data.setting;
        setSetting(s);
        setExpireDuration(String(s.expire_duration_month));
        setPerQrStandPrice(String(s.per_qr_stand_price || 0));
        setSubscriptionFeePerMonth(String(s.subscription_fee_per_month || 0));
        // New fields
        setPerTransactionFee(String(s.per_transaction_fee ?? 10));
        setIsSubscriptionFee(s.is_subscription_fee ?? true);
        setDueThreshold(String(s.due_threshold ?? 1000));
        setIsWhatsappUsage(s.is_whatsapp_usage ?? true);
        setWhatsappPerUsage(String(s.whatsapp_per_usage ?? 0));
        setShareDistributionDay(String(s.share_distribution_day ?? 7));
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
      const perTransactionFeeInt = parseInt(perTransactionFee);
      const dueThresholdInt = parseInt(dueThreshold);
      const whatsappPerUsageInt = parseInt(whatsappPerUsage);
      const shareDistributionDayInt = parseInt(shareDistributionDay);

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

      if (isNaN(perTransactionFeeInt) || perTransactionFeeInt < 0) {
        toast.error('Per transaction fee must be a non-negative integer');
        setSaving(false);
        return;
      }

      if (isNaN(dueThresholdInt) || dueThresholdInt < 0) {
        toast.error('Due threshold must be a non-negative integer');
        setSaving(false);
        return;
      }

      if (isNaN(whatsappPerUsageInt) || whatsappPerUsageInt < 0) {
        toast.error('WhatsApp per usage must be a non-negative integer');
        setSaving(false);
        return;
      }

      if (isNaN(shareDistributionDayInt) || shareDistributionDayInt < 1 || shareDistributionDayInt > 28) {
        toast.error('Share distribution day must be between 1 and 28');
        setSaving(false);
        return;
      }

      const response = await api.post('/api/settings/update/', {
        expire_duration_month: expireDurationInt,
        per_qr_stand_price: perQrStandPriceInt,
        subscription_fee_per_month: subscriptionFeeInt,
        per_transaction_fee: perTransactionFeeInt,
        is_subscription_fee: isSubscriptionFee,
        due_threshold: dueThresholdInt,
        is_whatsapp_usage: isWhatsappUsage,
        whatsapp_per_usage: whatsappPerUsageInt,
        share_distribution_day: shareDistributionDayInt,
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subscription Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Subscription Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="expireDuration">Expire Duration (months)</Label>
                  <Input
                    id="expireDuration"
                    type="number"
                    step="1"
                    value={expireDuration}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setExpireDuration(value);
                      }
                    }}
                    min="1"
                    required
                  />
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
                      if (value === '' || /^\d+$/.test(value)) {
                        setSubscriptionFeePerMonth(value);
                      }
                    }}
                    min="0"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isSubscriptionFee">Enable Subscription Fee</Label>
                  <Switch
                    id="isSubscriptionFee"
                    checked={isSubscriptionFee}
                    onCheckedChange={setIsSubscriptionFee}
                  />
                </div>
              </div>

              {/* Transaction Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Transaction Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="perTransactionFee">Per Transaction Fee (₹)</Label>
                  <Input
                    id="perTransactionFee"
                    type="number"
                    step="1"
                    value={perTransactionFee}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setPerTransactionFee(value);
                      }
                    }}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Service charge per order</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueThreshold">Due Threshold (₹)</Label>
                  <Input
                    id="dueThreshold"
                    type="number"
                    step="1"
                    value={dueThreshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setDueThreshold(value);
                      }
                    }}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Alert when dues exceed this amount</p>
                </div>
              </div>

              {/* WhatsApp Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">WhatsApp Settings</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isWhatsappUsage">Enable WhatsApp Usage Tracking</Label>
                  <Switch
                    id="isWhatsappUsage"
                    checked={isWhatsappUsage}
                    onCheckedChange={setIsWhatsappUsage}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappPerUsage">WhatsApp Per Usage (₹)</Label>
                  <Input
                    id="whatsappPerUsage"
                    type="number"
                    step="1"
                    value={whatsappPerUsage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setWhatsappPerUsage(value);
                      }
                    }}
                    min="0"
                    required
                    disabled={!isWhatsappUsage}
                  />
                  <p className="text-xs text-muted-foreground">Cost per WhatsApp message</p>
                </div>
              </div>

              {/* QR Stand & Share Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">QR Stand & Share Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="perQrStandPrice">Per QR Stand Price (₹)</Label>
                  <Input
                    id="perQrStandPrice"
                    type="number"
                    step="1"
                    value={perQrStandPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setPerQrStandPrice(value);
                      }
                    }}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shareDistributionDay">Share Distribution Day (1-28)</Label>
                  <Input
                    id="shareDistributionDay"
                    type="number"
                    step="1"
                    value={shareDistributionDay}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setShareDistributionDay(value);
                      }
                    }}
                    min="1"
                    max="28"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Day of month for share distribution</p>
                </div>
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
                    setPerTransactionFee(String(setting.per_transaction_fee ?? 10));
                    setIsSubscriptionFee(setting.is_subscription_fee ?? true);
                    setDueThreshold(String(setting.due_threshold ?? 1000));
                    setIsWhatsappUsage(setting.is_whatsapp_usage ?? true);
                    setWhatsappPerUsage(String(setting.whatsapp_per_usage ?? 0));
                    setShareDistributionDay(String(setting.share_distribution_day ?? 7));
                  }
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* System Balance */}
              {setting && setting.balance !== undefined && (
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-medium">System Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">₹{setting.balance.toLocaleString()}</p>
                </div>
              )}

              {/* Subscription Settings */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Subscription Settings</h3>
                <DetailRow label="Expire Duration" value={`${setting?.expire_duration_month || 12} months`} />
                <DetailRow label="Subscription Fee Per Month" value={`₹${setting?.subscription_fee_per_month || 0}`} />
                <DetailRow label="Subscription Fee Enabled" value={setting?.is_subscription_fee ? 'Yes' : 'No'} />
              </div>

              {/* Transaction Settings */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Transaction Settings</h3>
                <DetailRow label="Per Transaction Fee" value={`₹${setting?.per_transaction_fee ?? 10}`} />
                <DetailRow label="Due Threshold" value={`₹${setting?.due_threshold ?? 1000}`} />
              </div>

              {/* WhatsApp Settings */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">WhatsApp Settings</h3>
                <DetailRow label="WhatsApp Usage Tracking" value={setting?.is_whatsapp_usage ? 'Enabled' : 'Disabled'} />
                <DetailRow label="WhatsApp Per Usage" value={`₹${setting?.whatsapp_per_usage ?? 0}`} />
              </div>

              {/* QR Stand & Share Settings */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">QR Stand & Share Settings</h3>
                <DetailRow label="Per QR Stand Price" value={`₹${setting?.per_qr_stand_price || 0}`} />
                <DetailRow label="Share Distribution Day" value={`Day ${setting?.share_distribution_day ?? 7} of month`} />
              </div>

              {setting && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium text-sm text-muted-foreground">Timestamps</h3>
                  <DetailRow label="Created At" value={new Date(setting.created_at).toLocaleString()} />
                  <DetailRow label="Updated At" value={new Date(setting.updated_at).toLocaleString()} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
