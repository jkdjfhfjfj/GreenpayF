import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Save, 
  DollarSign,
  Shield,
  Mail,
  Globe,
  MessageCircle,
  Server,
  Lock,
  Users
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings } from "@/hooks/use-admin-settings";

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface SystemSettingsResponse {
  settings: SystemSetting[];
}

export default function AdminSettings() {
  const { 
    settings, 
    saveSettings, 
    updateFees, 
    updateSecurity, 
    updateNotifications,
    updateGeneral,
    updateWhatsApp,
    isLoaded 
  } = useAdminSettings();

  const [fees, setFees] = useState(settings.fees);
  const [security, setSecurity] = useState(settings.security);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [general, setGeneral] = useState(settings.general);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local state with hook settings
  useEffect(() => {
    if (isLoaded) {
      setFees(settings.fees);
      setSecurity({
        ...settings.security,
        enable_otp_feature: settings.security.enable_otp_feature !== undefined ? settings.security.enable_otp_feature : true
      });
      setNotifications(settings.notifications);
      setWhatsapp(settings.whatsapp);
      setGeneral(settings.general);
    }
  }, [settings, isLoaded]);

  const { data: settingsData, isLoading } = useQuery<SystemSettingsResponse>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/settings");
      return response.json();
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("PUT", `/api/admin/settings/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveFees = () => {
    updateFees(fees);
    saveSettings({ ...settings, fees });
    Object.entries(fees).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value });
    });
  };

  const handleSaveSecurity = async () => {
    updateSecurity(security);
    saveSettings({ ...settings, security });
    Object.entries(security).forEach(([key, value]) => {
      let backendKey = key;
      let finalValue = value.toString();
      
      // Special mapping for OTP feature settings
      if (key === 'enable_otp_feature') {
        backendKey = 'enable_otp_messages';
        finalValue = value ? 'true' : 'false';
      } else if (key === 'otp_email_enabled') {
        backendKey = 'otp_email_enabled';
        finalValue = value ? 'true' : 'false';
      } else if (key === 'otp_sms_enabled') {
        backendKey = 'otp_sms_enabled';
        finalValue = value ? 'true' : 'false';
      } else if (key === 'otp_whatsapp_enabled') {
        backendKey = 'otp_whatsapp_enabled';
        finalValue = value ? 'true' : 'false';
      }
      
      updateSettingMutation.mutate({ key: backendKey, value: finalValue });
    });
  };

  const handleSaveNotifications = () => {
    updateNotifications(notifications);
    saveSettings({ ...settings, notifications });
    Object.entries(notifications).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value: value.toString() });
    });
  };

  const handleSaveGeneral = () => {
    updateGeneral(general);
    saveSettings({ ...settings, general });
    Object.entries(general).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value: value.toString() });
    });
  };

  const handleSaveWhatsApp = async () => {
    if (!whatsapp.phone_number_id || !whatsapp.business_account_id || !whatsapp.access_token) {
      toast({
        title: "Error",
        description: "Please fill in all WhatsApp configuration fields",
        variant: "destructive",
      });
      return;
    }

    updateWhatsApp(whatsapp);
    saveSettings({ ...settings, whatsapp });

    try {
      const response = await apiRequest("POST", "/api/admin/whatsapp/config", {
        phoneNumberId: whatsapp.phone_number_id,
        businessAccountId: whatsapp.business_account_id,
        accessToken: whatsapp.access_token,
        isActive: whatsapp.is_active
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "WhatsApp configuration saved successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp/config"] });
      } else {
        toast({
          title: "Error",
          description: "Failed to save WhatsApp configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving WhatsApp configuration",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure platform settings, fees, and system behavior
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="fees" className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
          <TabsList className="inline-flex h-10 w-full justify-start rounded-none bg-transparent p-1">
            <TabsTrigger value="fees" className="rounded-md px-3">Fees & Pricing</TabsTrigger>
            <TabsTrigger value="security" className="rounded-md px-3">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-md px-3">Notifications</TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-md px-3">WhatsApp</TabsTrigger>
            <TabsTrigger value="general" className="rounded-md px-3">General</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Configuration
              </CardTitle>
              <CardDescription>
                Configure Meta WhatsApp Business API credentials for admin messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">Webhook Information</p>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">URL:</span> <code className="bg-white p-1 rounded border">https://&lt;your-domain&gt;/api/whatsapp/webhook</code></p>
                  <p><span className="font-medium">Verify Token:</span> <code className="bg-white p-1 rounded border">greenpay_verify_token_2024</code></p>
                  <p className="text-blue-800 mt-2">Enter these in your Meta App Dashboard webhook settings</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone Number ID</Label>
                  <Input
                    id="phone_number_id"
                    placeholder="Your WhatsApp phone number ID from Meta"
                    value={whatsapp.phone_number_id}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phone_number_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_account_id">Business Account ID</Label>
                  <Input
                    id="business_account_id"
                    placeholder="Your WhatsApp Business Account ID"
                    value={whatsapp.business_account_id}
                    onChange={(e) => setWhatsapp({ ...whatsapp, business_account_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token</Label>
                <Input
                  id="access_token"
                  type="password"
                  placeholder="Your Meta access token with whatsapp_business_messaging permission"
                  value={whatsapp.access_token}
                  onChange={(e) => setWhatsapp({ ...whatsapp, access_token: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="whatsapp_active" 
                  checked={whatsapp.is_active} 
                  onChange={(e) => setWhatsapp({ ...whatsapp, is_active: e.target.checked })}
                  className="w-4 h-4" 
                />
                <Label htmlFor="whatsapp_active">Enable WhatsApp Messaging</Label>
              </div>

              <Button className="w-full" onClick={handleSaveWhatsApp}>
                <Save className="w-4 h-4 mr-2" />
                Save WhatsApp Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees & Pricing Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fees & Pricing Configuration
              </CardTitle>
              <CardDescription>
                Set transaction fees and pricing for different services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer_fee">Transfer Fee ($)</Label>
                  <Input
                    id="transfer_fee"
                    type="number"
                    step="0.01"
                    value={fees.transfer_fee}
                    onChange={(e) => setFees({ ...fees, transfer_fee: e.target.value })}
                    data-testid="input-transfer-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate_margin">Exchange Rate Margin (%)</Label>
                  <Input
                    id="exchange_rate_margin"
                    type="number"
                    step="0.01"
                    value={fees.exchange_rate_margin}
                    onChange={(e) => setFees({ ...fees, exchange_rate_margin: e.target.value })}
                    data-testid="input-exchange-margin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="virtual_card_fee">Virtual Card Fee ($)</Label>
                  <Input
                    id="virtual_card_fee"
                    type="number"
                    step="0.01"
                    value={fees.virtual_card_fee}
                    onChange={(e) => setFees({ ...fees, virtual_card_fee: e.target.value })}
                    data-testid="input-card-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_fee">Withdrawal Fee ($)</Label>
                  <Input
                    id="withdrawal_fee"
                    type="number"
                    step="0.01"
                    value={fees.withdrawal_fee}
                    onChange={(e) => setFees({ ...fees, withdrawal_fee: e.target.value })}
                    data-testid="input-withdrawal-fee"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveFees}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-fees"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Fee Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security settings and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication Required</Label>
                      <p className="text-sm text-gray-500">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={security.two_factor_required}
                      onCheckedChange={(checked) => setSecurity({ ...security, two_factor_required: checked })}
                      data-testid="switch-2fa-required"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>KYC Auto-Approval</Label>
                      <p className="text-sm text-gray-500">Automatically approve KYC documents</p>
                    </div>
                    <Switch
                      checked={security.kyc_auto_approval}
                      onCheckedChange={(checked) => setSecurity({ ...security, kyc_auto_approval: checked })}
                      data-testid="switch-kyc-auto"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>OTP Feature</Label>
                      <p className="text-sm text-gray-500">Enable OTP verification during login</p>
                    </div>
                    <Switch
                      checked={security.enable_otp_feature !== false}
                      onCheckedChange={(checked) => setSecurity({ ...security, enable_otp_feature: checked })}
                      data-testid="switch-otp-feature"
                    />
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-medium text-gray-700">OTP Methods (if OTP enabled):</p>
                    <div className="flex items-center justify-between pl-4">
                      <Label className="font-normal">Email OTP</Label>
                      <Switch
                        checked={security.otp_email_enabled !== false}
                        onCheckedChange={(checked) => setSecurity({ ...security, otp_email_enabled: checked })}
                        data-testid="switch-otp-email"
                      />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <Label className="font-normal">SMS OTP</Label>
                      <Switch
                        checked={security.otp_sms_enabled !== false}
                        onCheckedChange={(checked) => setSecurity({ ...security, otp_sms_enabled: checked })}
                        data-testid="switch-otp-sms"
                      />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <Label className="font-normal">WhatsApp OTP</Label>
                      <Switch
                        checked={security.otp_whatsapp_enabled !== false}
                        onCheckedChange={(checked) => setSecurity({ ...security, otp_whatsapp_enabled: checked })}
                        data-testid="switch-otp-whatsapp"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_daily_limit">Max Daily Limit ($)</Label>
                    <Input
                      id="max_daily_limit"
                      type="number"
                      value={security.max_daily_limit}
                      onChange={(e) => setSecurity({ ...security, max_daily_limit: e.target.value })}
                      data-testid="input-daily-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_transaction_amount">Min Transaction Amount ($)</Label>
                    <Input
                      id="min_transaction_amount"
                      type="number"
                      step="0.01"
                      value={security.min_transaction_amount}
                      onChange={(e) => setSecurity({ ...security, min_transaction_amount: e.target.value })}
                      data-testid="input-min-amount"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSaveSecurity}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-security"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure notification preferences and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                    data-testid="switch-email-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS notifications for transactions</p>
                  </div>
                  <Switch
                    checked={notifications.sms_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, sms_notifications: checked })}
                    data-testid="switch-sms-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Send mobile push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                    data-testid="switch-push-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Admin Alerts</Label>
                    <p className="text-sm text-gray-500">Receive admin alerts for critical events</p>
                  </div>
                  <Switch
                    checked={notifications.admin_alerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, admin_alerts: checked })}
                    data-testid="switch-admin-alerts"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveNotifications}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-notifications"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Platform-wide settings and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform_name">Platform Name</Label>
                    <Input
                      id="platform_name"
                      value={general.platform_name}
                      onChange={(e) => setGeneral({ ...general, platform_name: e.target.value })}
                      data-testid="input-platform-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={general.support_email}
                      onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
                      data-testid="input-support-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Input
                      id="default_currency"
                      value={general.default_currency}
                      onChange={(e) => setGeneral({ ...general, default_currency: e.target.value })}
                      data-testid="input-default-currency"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={general.session_timeout}
                      onChange={(e) => setGeneral({ ...general, session_timeout: e.target.value })}
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_rate_limit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="api_rate_limit"
                      type="number"
                      value={general.api_rate_limit}
                      onChange={(e) => setGeneral({ ...general, api_rate_limit: e.target.value })}
                      data-testid="input-api-rate-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_upload_size">Max Upload Size (MB)</Label>
                    <Input
                      id="max_upload_size"
                      type="number"
                      value={general.max_upload_size}
                      onChange={(e) => setGeneral({ ...general, max_upload_size: e.target.value })}
                      data-testid="input-max-upload-size"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms_url">Terms of Service URL</Label>
                  <Input
                    id="terms_url"
                    type="url"
                    value={general.terms_url}
                    onChange={(e) => setGeneral({ ...general, terms_url: e.target.value })}
                    data-testid="input-terms-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance_message"
                    placeholder="Enter message to display during maintenance..."
                    value={general.maintenance_message}
                    onChange={(e) => setGeneral({ ...general, maintenance_message: e.target.value })}
                    data-testid="textarea-maintenance-message"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <Label className="text-amber-900">Maintenance Mode</Label>
                    <p className="text-sm text-amber-700">Block user access to the platform</p>
                  </div>
                  <Switch
                    checked={general.maintenance_mode}
                    onCheckedChange={(checked) => setGeneral({ ...general, maintenance_mode: checked })}
                    data-testid="switch-maintenance-mode"
                  />
                </div>
                <Button 
                  onClick={handleSaveGeneral}
                  disabled={updateSettingMutation.isPending}
                  data-testid="button-save-general"
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Management
                </CardTitle>
                <CardDescription>
                  Application administration and monitoring tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Backup Database</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="text-sm">View Audit Logs</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Server className="w-5 h-5" />
                    <span className="text-sm">System Status</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">Revenue Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bulk User Management
                </CardTitle>
                <CardDescription>
                  Perform bulk operations on user accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="destructive" className="w-full">
                    Deactivate Inactive Users (30+ days)
                  </Button>
                  <Button variant="outline" className="w-full">
                    Export User List (CSV)
                  </Button>
                  <Button variant="outline" className="w-full">
                    Reset Failed Login Attempts
                  </Button>
                  <Button variant="outline" className="w-full">
                    Sync KYC Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}