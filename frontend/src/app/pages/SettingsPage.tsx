import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { api } from '../services/api';

interface SettingsState {
  businessName: string;
  businessEmail: string;
  timezone: string;
  currency: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  maintenanceMode: boolean;
}

const STORAGE_KEY = 'salon-settings';

const defaultSettings: SettingsState = {
  businessName: 'Salon Pro',
  businessEmail: 'hello@salonpro.com',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  emailAlerts: true,
  smsAlerts: true,
  maintenanceMode: false,
};

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Load from local cache first
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // 2. Sync from MongoDB database
    api.getResource<any>('settings')
      .then((data) => {
        if (data && data.length > 0) {
          const remoteSettings = data[0];
          setSettings({
            businessName: remoteSettings.businessName || defaultSettings.businessName,
            businessEmail: remoteSettings.businessEmail || defaultSettings.businessEmail,
            timezone: remoteSettings.timezone || defaultSettings.timezone,
            currency: remoteSettings.currency || defaultSettings.currency,
            emailAlerts: remoteSettings.emailAlerts ?? defaultSettings.emailAlerts,
            smsAlerts: remoteSettings.smsAlerts ?? defaultSettings.smsAlerts,
            maintenanceMode: remoteSettings.maintenanceMode ?? defaultSettings.maintenanceMode,
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSettings));
        }
      })
      .catch((err) => {
        console.warn('Failed to load settings from DB:', err.message);
      });
  }, []);

  const handleFieldChange = <K extends keyof SettingsState>(field: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      await api.updateResource('settings', 'global_settings', {
        id: 'global_settings',
        ...settings,
      });
      toast.success('Admin settings saved permanently to database');
    } catch (err) {
      toast.error('Failed to update remote settings, saved locally');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-400" /> Settings & Configurations
        </h1>
        <p className="text-muted-foreground">Configure business preferences and operational controls stored permanently in database.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Business details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={settings.businessName}
                onChange={(event) => handleFieldChange('businessName', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email">Business email</Label>
              <Input
                id="business-email"
                type="email"
                value={settings.businessEmail}
                onChange={(event) => handleFieldChange('businessEmail', event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(event) => handleFieldChange('timezone', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={settings.currency}
                  onChange={(event) => handleFieldChange('currency', event.target.value)}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Database Persistence Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Admin configuration & operational details are synchronized directly with MongoDB.</p>
          <p>All updates are permanently persisted across server reboots and browser sessions.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold text-black"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Settings to DB'}
        </Button>
      </div>
    </div>
  );
};
