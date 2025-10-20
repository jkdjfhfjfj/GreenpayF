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
import { MessageSquare, Save, Send, CheckCircle, Settings } from "lucide-react";

interface MessagingSettings {
  apiKey: string;
  accountEmail: string;
  senderId: string;
  whatsappSessionId: string;
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
    whatsappSessionId: ""
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
        toast({
          title: "Message Sent",
          description: `Message sent via ${result.sms ? 'SMS' : ''} ${result.sms && result.whatsapp ? 'and' : ''} ${result.whatsapp ? 'WhatsApp' : ''}`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messaging Settings</h2>
          <p className="text-gray-600 mt-1">Configure SMS and WhatsApp messaging via TalkNTalk API</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          TalkNTalk Integration
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Update TalkNTalk API credentials for SMS and WhatsApp
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
                    Your TalkNTalk API key for authentication
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
                    placeholder="TextSMS"
                  />
                  <p className="text-sm text-gray-500">
                    SMS sender ID (alphanumeric, max 11 characters)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappSessionId">WhatsApp Session ID</Label>
                  <Input
                    id="whatsappSessionId"
                    value={settings.whatsappSessionId}
                    onChange={(e) => setSettings({ ...settings, whatsappSessionId: e.target.value })}
                    placeholder="Enter WhatsApp session ID"
                  />
                  <p className="text-sm text-gray-500">
                    WhatsApp business session ID from TalkNTalk dashboard
                  </p>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Send Individual Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Message to User
            </CardTitle>
            <CardDescription>
              Send a custom message to any user via SMS and WhatsApp
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
                maxLength={149} // 160 - 11 chars for "[Greenpay] "
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
              {sendingMessage ? 'Sending...' : 'Send Message (SMS + WhatsApp)'}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <span className="material-icons text-sm mt-0.5">info</span>
                <span>
                  Messages are sent concurrently via both SMS and WhatsApp. All messages are automatically prefixed with "[Greenpay]".
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <li>• <strong>OTP Verification:</strong> Login verification code</li>
                <li>• <strong>Fund Receipt:</strong> Money received notification</li>
                <li>• <strong>Login Alert:</strong> Location and IP on new login</li>
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

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Message Format:</h4>
              <ul className="space-y-1">
                <li>• All messages start with "[Greenpay]" prefix</li>
                <li>• Maximum 160 characters including prefix</li>
                <li>• Messages sent concurrently via SMS & WhatsApp</li>
                <li>• Phone numbers auto-formatted to Kenya (254xxx)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">API Requirements:</h4>
              <ul className="space-y-1">
                <li>• Valid TalkNTalk API credentials required</li>
                <li>• WhatsApp session must be active</li>
                <li>• Sender ID must be approved by TalkNTalk</li>
                <li>• Test with individual message before relying on auto notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
