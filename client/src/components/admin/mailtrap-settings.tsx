import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MailtrapSettings {
  apiKey: string;
  isConfigured: boolean;
}

export default function MailtrapSettings() {
  const [settings, setSettings] = useState<MailtrapSettings>({
    apiKey: "",
    isConfigured: false
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setInitialLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/mailtrap-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading Mailtrap settings:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load Mailtrap settings",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.apiKey.trim()) {
      toast({
        title: "Validation Error",
        description: "API key is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-settings', {
        apiKey: settings.apiKey.trim()
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Mailtrap API key saved successfully",
        });
        await loadSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save Mailtrap settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Test email address is required",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-test', {
        email: testEmail.trim()
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test email sent successfully",
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Mailtrap Email Service
          </CardTitle>
          <CardDescription>
            Configure Mailtrap API for sending transactional emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.isConfigured ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Mailtrap is configured and ready to use
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Mailtrap is not configured. Add your API key below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-key">Mailtrap API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Mailtrap API token"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Get your API key from your Mailtrap account settings
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      {settings.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Test Email Service</CardTitle>
            <CardDescription>
              Send a test email to verify Mailtrap configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleTest}
              disabled={testing}
              className="w-full"
              variant="outline"
            >
              {testing ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Available Templates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>✓ OTP Verification</p>
          <p>✓ Password Reset</p>
          <p>✓ Welcome Email</p>
          <p>✓ KYC Submitted</p>
          <p>✓ KYC Verified</p>
          <p>✓ Login Alert</p>
        </CardContent>
      </Card>
    </div>
  );
}
