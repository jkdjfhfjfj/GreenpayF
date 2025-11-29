import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, AlertCircle, Loader2, CheckCircle, Save, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export default function MailManagement() {
  const { toast } = useToast();
  const [mailtrapApiKey, setMailtrapApiKey] = useState("");
  const [mailtrapConfigured, setMailtrapConfigured] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [savingMailtrap, setSavingMailtrap] = useState(false);
  const [testingMailtrap, setTestingMailtrap] = useState(false);
  
  // Test template state
  const [testTemplateUuid, setTestTemplateUuid] = useState("");
  const [testTemplateEmail, setTestTemplateEmail] = useState("");
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [sendingTestTemplate, setSendingTestTemplate] = useState(false);
  
  // Send to user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [templateUuid, setTemplateUuid] = useState("");
  const [userParams, setUserParams] = useState<Record<string, string>>({});
  const [sendingToUser, setSendingToUser] = useState(false);
  
  // Parameter key-value input
  const [paramKey, setParamKey] = useState("");
  const [paramValue, setParamValue] = useState("");

  useEffect(() => {
    loadMailtrapSettings();
    loadUsers();
  }, []);

  const loadMailtrapSettings = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/mailtrap-settings');
      if (response.ok) {
        const data = await response.json();
        setMailtrapConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Error loading Mailtrap settings:', error);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiRequest('GET', '/api/admin/users-list');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveMailtrap = async () => {
    if (!mailtrapApiKey.trim()) {
      toast({
        title: "Validation Error",
        description: "API key is required",
        variant: "destructive",
      });
      return;
    }

    setSavingMailtrap(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-settings', {
        apiKey: mailtrapApiKey.trim()
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Mailtrap API key saved successfully",
        });
        setMailtrapConfigured(true);
        setMailtrapApiKey("");
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
      setSavingMailtrap(false);
    }
  };

  const handleTestMailtrap = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Test email address is required",
        variant: "destructive",
      });
      return;
    }

    setTestingMailtrap(true);
    try {
      const response = await apiRequest('POST', '/api/admin/mailtrap-test', {
        email: testEmail.trim()
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test email sent successfully",
        });
        setTestEmail("");
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
      setTestingMailtrap(false);
    }
  };

  const addTestParameter = () => {
    if (!paramKey.trim()) {
      toast({
        title: "Validation Error",
        description: "Parameter key is required",
        variant: "destructive",
      });
      return;
    }
    setTestParams({ ...testParams, [paramKey]: paramValue });
    setParamKey("");
    setParamValue("");
  };

  const removeTestParameter = (key: string) => {
    const newParams = { ...testParams };
    delete newParams[key];
    setTestParams(newParams);
  };

  const handleSendTestTemplate = async () => {
    if (!testTemplateUuid.trim() || !testTemplateEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Template UUID and email are required",
        variant: "destructive",
      });
      return;
    }

    setSendingTestTemplate(true);
    try {
      const response = await apiRequest('POST', '/api/admin/send-template-test', {
        email: testTemplateEmail.trim(),
        templateUuid: testTemplateUuid.trim(),
        parameters: testParams
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template email sent successfully",
        });
        setTestTemplateUuid("");
        setTestTemplateEmail("");
        setTestParams({});
      } else {
        throw new Error('Failed to send template');
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send template email",
        variant: "destructive",
      });
    } finally {
      setSendingTestTemplate(false);
    }
  };

  const addUserParameter = () => {
    if (!paramKey.trim()) {
      toast({
        title: "Validation Error",
        description: "Parameter key is required",
        variant: "destructive",
      });
      return;
    }
    setUserParams({ ...userParams, [paramKey]: paramValue });
    setParamKey("");
    setParamValue("");
  };

  const removeUserParameter = (key: string) => {
    const newParams = { ...userParams };
    delete newParams[key];
    setUserParams(newParams);
  };

  const handleSendToUser = async () => {
    if (!selectedUser?.id || !templateUuid.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user and provide a template UUID",
        variant: "destructive",
      });
      return;
    }

    setSendingToUser(true);
    try {
      const response = await apiRequest('POST', '/api/admin/send-template-to-user', {
        userId: selectedUser.id,
        templateUuid: templateUuid.trim(),
        parameters: userParams
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template email sent to user successfully",
        });
        setSelectedUser(null);
        setTemplateUuid("");
        setUserParams({});
      } else {
        throw new Error('Failed to send to user');
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send template to user",
        variant: "destructive",
      });
    } finally {
      setSendingToUser(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Mail Management</h2>
        <p className="text-gray-600 mt-1">Manage Mailtrap templates and send transactional emails to users</p>
      </div>

      {/* Mailtrap Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Mailtrap Email Service
          </CardTitle>
          <CardDescription>
            Configure Mailtrap for sending transactional emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mailtrapConfigured ? (
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
              value={mailtrapApiKey}
              onChange={(e) => setMailtrapApiKey(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Get your API key from your Mailtrap account settings
            </p>
          </div>

          <Button
            onClick={handleSaveMailtrap}
            disabled={savingMailtrap}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingMailtrap ? 'Saving...' : 'Save API Key'}
          </Button>

          {mailtrapConfigured && (
            <div className="space-y-4 p-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="test-email">Send Quick Test Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={handleTestMailtrap}
                disabled={testingMailtrap}
                className="w-full"
                variant="outline"
              >
                {testingMailtrap ? 'Sending...' : 'Send Quick Test'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mailtrapConfigured && (
        <>
          {/* Test Template Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Test Mailtrap Template
              </CardTitle>
              <CardDescription>
                Send a Mailtrap template by UUID to test it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-uuid">Template UUID *</Label>
                  <Input
                    id="test-uuid"
                    placeholder="e.g., 64254a5b-a2ba-4b7d-aa41-5a0907c836db"
                    value={testTemplateUuid}
                    onChange={(e) => setTestTemplateUuid(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-email-addr">Email Address *</Label>
                  <Input
                    id="test-email-addr"
                    type="email"
                    placeholder="recipient@example.com"
                    value={testTemplateEmail}
                    onChange={(e) => setTestTemplateEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-sm">Template Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Parameter key (e.g., first_name)"
                    value={paramKey}
                    onChange={(e) => setParamKey(e.target.value)}
                  />
                  <Input
                    placeholder="Parameter value"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                  />
                  <Button
                    onClick={addTestParameter}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {Object.keys(testParams).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(testParams).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm">
                          <span className="font-semibold">{key}:</span> {value}
                        </span>
                        <Button
                          onClick={() => removeTestParameter(key)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendTestTemplate}
                disabled={sendingTestTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {sendingTestTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Send to User Card - EMAIL ONLY */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Email Template to User
              </CardTitle>
              <CardDescription>
                Send a Mailtrap template to a specific user via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User *</Label>
                {loadingUsers ? (
                  <div className="p-3 bg-gray-50 rounded border text-sm text-gray-600">
                    Loading users...
                  </div>
                ) : (
                  <select
                    id="user-select"
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value);
                      setSelectedUser(user || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Select a user --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || 'Unknown'} ({user.email || user.phone || 'No contact'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Selected:</span> {selectedUser.name || 'Unknown'} ({selectedUser.email})
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template-uuid">Template UUID *</Label>
                <Input
                  id="template-uuid"
                  placeholder="e.g., 64254a5b-a2ba-4b7d-aa41-5a0907c836db"
                  value={templateUuid}
                  onChange={(e) => setTemplateUuid(e.target.value)}
                />
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-sm">Template Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Parameter key (e.g., otp)"
                    value={paramKey}
                    onChange={(e) => setParamKey(e.target.value)}
                  />
                  <Input
                    placeholder="Parameter value"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                  />
                  <Button
                    onClick={addUserParameter}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {Object.keys(userParams).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(userParams).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm">
                          <span className="font-semibold">{key}:</span> {value}
                        </span>
                        <Button
                          onClick={() => removeUserParameter(key)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendToUser}
                disabled={sendingToUser || !selectedUser}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {sendingToUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
