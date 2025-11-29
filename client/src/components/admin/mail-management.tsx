import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, ImagePlus, Link as LinkIcon, Bold, Italic, Underline, List, AlertCircle, Loader2, CheckCircle, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MailManagement() {
  const { toast } = useToast();
  const [mailtrapApiKey, setMailtrapApiKey] = useState("");
  const [mailtrapConfigured, setMailtrapConfigured] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [savingMailtrap, setSavingMailtrap] = useState(false);
  const [testingMailtrap, setTestingMailtrap] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
    imageUrl: "",
    linkText: "",
    linkUrl: "",
  });

  // Load Mailtrap settings on mount
  useEffect(() => {
    loadMailtrapSettings();
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

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/send-custom-email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully",
        description: "The custom email has been delivered to the user.",
      });
      setFormData({
        email: "",
        subject: "",
        message: "",
        imageUrl: "",
        linkText: "",
        linkUrl: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing required fields",
        description: "Please fill in email, subject, and message fields.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate(formData);
  };

  const insertFormatting = (type: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.message.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorOffset = 3;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        cursorOffset = 3;
        break;
      default:
        formattedText = selectedText;
    }

    const newMessage = 
      formData.message.substring(0, start) +
      formattedText +
      formData.message.substring(end);

    setFormData({ ...formData, message: newMessage });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + cursorOffset,
        start + cursorOffset + selectedText.length
      );
    }, 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Mail Management</h2>
        <p className="text-gray-600 mt-1">Send custom emails to specific users with formatting, images, and links</p>
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
                <Label htmlFor="test-email">Send Test Email</Label>
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
                {testingMailtrap ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Compose Custom Email
          </CardTitle>
          <CardDescription>
            Send personalized emails to users with rich formatting options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Enter the email address of the user you want to send this message to</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-textarea">Message *</Label>
              <div className="border rounded-lg">
                <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('bold')}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('italic')}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('underline')}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('list')}
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  id="message-textarea"
                  placeholder="Enter your message here. Use the toolbar above to format text."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[200px] border-0 focus-visible:ring-0 resize-none"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Select text and use formatting buttons above. Supports: **bold**, *italic*, &lt;u&gt;underline&lt;/u&gt;, and • bullet points
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ImagePlus className="w-4 h-4" />
                Optional: Add Image
              </h3>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500">Paste the URL of an image to include in the email</p>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Optional: Add Call-to-Action Link
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkText">Link Text</Label>
                  <Input
                    id="linkText"
                    placeholder="Click here"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Link URL</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Add a button link to direct users to a specific page</p>
            </div>

            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                This email will be sent from your configured SMTP server. Make sure email settings are properly configured in Messaging Settings.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  email: "",
                  subject: "",
                  message: "",
                  imageUrl: "",
                  linkText: "",
                  linkUrl: "",
                })}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {sendEmailMutation.isPending ? (
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
