import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Send, X } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

interface SendTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: any[];
}

export default function SendTemplateModal({ isOpen, onClose, templates }: SendTemplateModalProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    select: (data: any) => data.users || []
  });

  const getParameterFields = (templateName: string) => {
    const fields: Record<string, { label: string; placeholder: string }> = {
      'otp': { code: { label: 'OTP Code', placeholder: '000000' } },
      'password_reset': { code: { label: 'Reset Code', placeholder: '000000' } },
      'card_activation': { lastFour: { label: 'Card Last 4 Digits', placeholder: '4242' } },
      'fund_receipt': {
        amount: { label: 'Amount', placeholder: '100.00' },
        currency: { label: 'Currency', placeholder: 'USD' },
        sender: { label: 'Sender Name', placeholder: 'John Doe' }
      },
      'login_alert': {
        location: { label: 'Location', placeholder: 'New York, USA' },
        ip: { label: 'IP Address', placeholder: '192.168.1.1' }
      }
    };
    return fields[templateName] || {};
  };

  const handleSend = async () => {
    if (!selectedUser || !selectedTemplate) {
      toast({
        title: "Validation Error",
        description: "Please select a user and template",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const response = await apiRequest('POST', '/api/admin/whatsapp/send-template', {
        userId: selectedUser,
        templateName: selectedTemplate,
        parameters
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Template Sent",
          description: `Template "${selectedTemplate}" sent successfully to user`
        });
        setSelectedUser("");
        setSelectedTemplate("");
        setParameters({});
        onClose();
      } else {
        throw new Error('Failed to send template');
      }
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send template",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const paramFields = getParameterFields(selectedTemplate);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Send Template to User</CardTitle>
            <CardDescription>Send a WhatsApp template to a specific user</CardDescription>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {usersData?.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template, idx) => (
                  <SelectItem key={idx} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {Object.entries(paramFields).map(([key, field]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{field.label}</Label>
              <Input
                id={key}
                placeholder={field.placeholder}
                value={parameters[key] || ''}
                onChange={(e) => setParameters({ ...parameters, [key]: e.target.value })}
              />
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
