'use client';

import { useEffect, useState } from 'react';
import { GlassCard, PrimaryButton, Skeleton } from '@/components/ui';
import { Settings, Bell, Globe, Shield, Palette, ChartBar, Save, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    signalAlerts: boolean;
    marketUpdates: boolean;
  };
  display: {
    currency: 'USD' | 'EUR' | 'GBP';
    timezone: string;
    language: 'en' | 'es' | 'fr' | 'de';
    chartType: 'candlestick' | 'line' | 'area';
  };
  trading: {
    defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'trading' | 'security'>('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setToastMessage('Failed to load settings');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setToastMessage('Settings saved successfully!');
      setShowToast(true);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage('Failed to save settings');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string[], value: any) => {
    if (!settings) return;
    
    const newSettings = JSON.parse(JSON.stringify(settings));
    let current = newSettings;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load settings</p>
        <PrimaryButton onClick={fetchSettings} className="mt-4">
          Retry
        </PrimaryButton>
      </div>
    );
  }

  const tabs = [
    { value: 'general' as const, label: 'General', icon: Palette },
    { value: 'notifications' as const, label: 'Notifications', icon: Bell },
    { value: 'trading' as const, label: 'Trading', icon: ChartBar },
    { value: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <GlassCard className="px-4 py-2 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">{toastMessage}</span>
          </GlassCard>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your trading experience
          </p>
        </div>
        <PrimaryButton 
          onClick={saveSettings} 
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </PrimaryButton>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-lg bg-black/20 backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
                activeTab === tab.value
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <div className="space-y-4">
              <SettingRow
                label="Theme"
                description="Choose your preferred color theme"
                value={settings.theme}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
                onChange={(value: string) => updateSetting(['theme'], value)}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
            <div className="space-y-4">
              <SettingRow
                label="Default Currency"
                value={settings.display.currency}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                ]}
                onChange={(value: string) => updateSetting(['display', 'currency'], value)}
              />

              <SettingRow
                label="Language"
                value={settings.display.language}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
                onChange={(value: string) => updateSetting(['display', 'language'], value)}
              />

              <SettingRow
                label="Default Chart Type"
                value={settings.display.chartType}
                options={[
                  { value: 'candlestick', label: 'Candlestick' },
                  { value: 'line', label: 'Line' },
                  { value: 'area', label: 'Area' },
                ]}
                onChange={(value: string) => updateSetting(['display', 'chartType'], value)}
              />
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <ToggleRow
                label="Email Notifications"
                description="Receive updates via email"
                checked={settings.notifications.email}
                onChange={(checked: boolean) => updateSetting(['notifications', 'email'], checked)}
              />
              <ToggleRow
                label="Push Notifications"
                description="Browser push notifications"
                checked={settings.notifications.push}
                onChange={(checked: boolean) => updateSetting(['notifications', 'push'], checked)}
              />
              <ToggleRow
                label="SMS Notifications"
                description="Text message alerts"
                checked={settings.notifications.sms}
                onChange={(checked: boolean) => updateSetting(['notifications', 'sms'], checked)}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Alert Types</h2>
            <div className="space-y-4">
              <ToggleRow
                label="Signal Alerts"
                description="New high-score signals"
                checked={settings.notifications.signalAlerts}
                onChange={(checked: boolean) => updateSetting(['notifications', 'signalAlerts'], checked)}
              />
              <ToggleRow
                label="Market Updates"
                description="Important market news"
                checked={settings.notifications.marketUpdates}
                onChange={(checked: boolean) => updateSetting(['notifications', 'marketUpdates'], checked)}
              />
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'trading' && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Trading Preferences</h2>
            <div className="space-y-4">
              <SettingRow
                label="Default Timeframe"
                value={settings.trading.defaultTimeframe}
                options={[
                  { value: '1m', label: '1 Minute' },
                  { value: '5m', label: '5 Minutes' },
                  { value: '15m', label: '15 Minutes' },
                  { value: '1h', label: '1 Hour' },
                  { value: '4h', label: '4 Hours' },
                  { value: '1d', label: '1 Day' },
                ]}
                onChange={(value: string) => updateSetting(['trading', 'defaultTimeframe'], value)}
              />

              <SettingRow
                label="Risk Level"
                value={settings.trading.riskLevel}
                options={[
                  { value: 'conservative', label: 'Conservative' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'aggressive', label: 'Aggressive' },
                ]}
                onChange={(value: string) => updateSetting(['trading', 'riskLevel'], value)}
              />

              <ToggleRow
                label="Auto Refresh"
                description="Automatically update data"
                checked={settings.trading.autoRefresh}
                onChange={(checked: boolean) => updateSetting(['trading', 'autoRefresh'], checked)}
              />

              {settings.trading.autoRefresh && (
                <SettingRow
                  label="Refresh Interval"
                  value={String(settings.trading.refreshInterval)}
                  options={[
                    { value: '10', label: '10 seconds' },
                    { value: '30', label: '30 seconds' },
                    { value: '60', label: '1 minute' },
                    { value: '300', label: '5 minutes' },
                  ]}
                  onChange={(value: string) => updateSetting(['trading', 'refreshInterval'], Number(value))}
                />
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'security' && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Security settings will be available in the full version</p>
            <p className="text-sm mt-2">Including 2FA, API keys, and session management</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function SettingRow({ label, description, value, options, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/20 border border-white/10 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-cyan-500" : "bg-black/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        
        <GlassCard className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}