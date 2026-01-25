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
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const [setting, setSetting] = useState<SuperSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expireDuration, setExpireDuration] = useState('12');
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
      const response = await api.post('/api/settings/update/', {
        expire_duration_month: parseInt(expireDuration) || 12,
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
                  value={expireDuration}
                  onChange={(e) => setExpireDuration(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  if (setting) {
                    setExpireDuration(String(setting.expire_duration_month));
                  }
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <DetailRow label="Expire Duration" value={`${setting?.expire_duration_month || 12} months`} />
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
