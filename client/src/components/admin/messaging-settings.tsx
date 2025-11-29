import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Save, Send, CheckCircle, Settings, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessagingSettings {
  // SMS Settings (TalkNTalk)
  apiKey: string;
  accountEmail: string;
  senderId: string;
  // WhatsApp Settings (Meta)
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
}

interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export default function MessagingSettings() {
  const [settings, setSettings] = useState<MessagingSettings>({
    apiKey: "",
    accountEmail: "",
    senderId: "",
    whatsappAccessToken: "",
    whatsappPhoneNumberId: ""
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  // Load users for messaging
  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    select: (data: any) => data.users || []
  });

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setInitialLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/messaging-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading messaging settings:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load messaging settings. Using default values.",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('PUT', '/api/admin/messaging-settings', settings);
      
      if (response.ok) {
        await loadSettings();
        toast({
          title: "Settings Updated",
          description: "Messaging configuration has been saved successfully.",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update messaging settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !customMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user and enter a message.",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const response = await apiRequest('POST', '/api/admin/send-message', {
        userId: selectedUser,
        message: customMessage
      });

      if (response.ok) {
        const result = await response.json();
        const channels = [];
        if (result.sms) channels.push('SMS');
        if (result.whatsapp) channels.push('WhatsApp');
        
        toast({
          title: "Message Sent",
          description: channels.length > 0 
            ? `Message sent via ${channels.join(' and ')}`
            : 'Message delivery status unknown',
        });
        setCustomMessage("");
        setSelectedUser("");
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const calculateRemainingChars = () => {
    const prefix = "[Greenpay] ";
    const total = prefix.length + customMessage.length;
    return 160 - total;
  };

  const isSmsConfigured = !!(settings.apiKey?.trim() && settings.accountEmail?.trim() && settings.senderId?.trim());
  const isWhatsAppConfigured = !!(settings.whatsappAccessToken?.trim() && settings.whatsappPhoneNumberId?.trim());
  const isAnyChannelConfigured = isSmsConfigured || isWhatsAppConfigured;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messaging Settings</h2>
          <p className="text-gray-600 mt-1">Configure SMS and WhatsApp messaging channels</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isSmsConfigured ? "default" : "outline"} className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS: {isSmsConfigured ? '✓ Configured' : 'Not Set'}
          </Badge>
          <Badge variant={isWhatsAppConfigured ? "default" : "outline"} className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp: {isWhatsAppConfigured ? '✓ Configured' : 'Not Set'}
          </Badge>
          {isAnyChannelConfigured && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Messaging Ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SMS Configuration
            </CardTitle>
            <CardDescription>
              Configure SMS delivery via TalkNTalk API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-sm text-muted-foreground">Loading settings...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (X-API-Key)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="Enter your TalkNTalk API key"
                  />
                  <p className="text-sm text-gray-500">
                    Your TalkNTalk API key for SMS authentication
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountEmail">Account Email (X-Account-Email)</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    value={settings.accountEmail}
                    onChange={(e) => setSettings({ ...settings, accountEmail: e.target.value })}
                    placeholder="support@greenpay.world"
                  />
                  <p className="text-sm text-gray-500">
                    Your TalkNTalk account email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <Input
                    id="senderId"
                    value={settings.senderId}
                    onChange={(e) => setSettings({ ...settings, senderId: e.target.value })}
                    placeholder="Greenpay"
                  />
                  <p className="text-sm text-gray-500">
                    SMS sender ID (alphanumeric, max 11 characters)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              WhatsApp Configuration
            </CardTitle>
            <CardDescription>
              Configure WhatsApp delivery via Meta Business API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-sm text-muted-foreground">Loading settings...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="whatsappAccessToken">Access Token</Label>
                  <Input
                    id="whatsappAccessToken"
                    type="password"
                    value={settings.whatsappAccessToken}
                    onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                    placeholder="Enter your Meta access token"
                  />
                  <p className="text-sm text-gray-500">
                    Your Meta WhatsApp Business API access token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
                  <Input
                    id="whatsappPhoneNumberId"
                    value={settings.whatsappPhoneNumberId}
                    onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                    placeholder="1234567890"
                  />
                  <p className="text-sm text-gray-500">
                    Your WhatsApp Business phone number ID from Meta
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Set up Meta Business account at developers.facebook.com and create WhatsApp Business app
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save All Settings'}
      </Button>

      {/* Send Individual Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Test Message
          </CardTitle>
          <CardDescription>
            Send a test message to any user via all configured channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter your message (without [Greenpay] prefix)"
              rows={4}
              maxLength={149}
            />
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">
                Message will be prefixed with "[Greenpay]"
              </p>
              <p className={`${calculateRemainingChars() < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {calculateRemainingChars()} chars remaining
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSendMessage} 
            disabled={sendingMessage || !selectedUser || !customMessage.trim() || calculateRemainingChars() < 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingMessage ? 'Sending...' : `Send Test Message${isSmsConfigured && isWhatsAppConfigured ? ' (SMS + WhatsApp)' : isSmsConfigured ? ' (SMS Only)' : isWhatsAppConfigured ? ' (WhatsApp Only)' : ''}`}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="material-icons text-sm mt-0.5">info</span>
              <span>
                Messages are sent via all configured channels. All messages are automatically prefixed with "[Greenpay]".
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Automatic Notifications Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Automatic Notifications
          </CardTitle>
          <CardDescription>
            Messages are automatically sent for the following events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">User Actions:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>OTP Verification:</strong> Login/signup verification code</li>
                <li>• <strong>Fund Receipt:</strong> Money received notification</li>
                <li>• <strong>Login Alert:</strong> Location and IP on new login</li>
                <li>• <strong>Password Reset:</strong> Password reset code</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Admin Actions:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>KYC Verified:</strong> Account verification complete</li>
                <li>• <strong>Card Activation:</strong> Virtual card activated</li>
                <li>• <strong>Transactions:</strong> Withdrawal & transfer updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">SMS (TalkNTalk):</h4>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Sign up at talkntalk.africa</li>
                <li>Get your API key and account email</li>
                <li>Create a sender ID</li>
                <li>Fill SMS settings above</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">WhatsApp (Meta):</h4>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Create Meta Business account</li>
                <li>Create WhatsApp Business app</li>
                <li>Get Phone Number ID & Access Token</li>
                <li>Fill WhatsApp settings above</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
