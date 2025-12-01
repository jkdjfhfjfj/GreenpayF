import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Send, X, AlertCircle, Upload } from "lucide-react";

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
  const [mediaFiles, setMediaFiles] = useState<Record<string, File>>({});
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    select: (data: any) => data.users || []
  });

  // Fetch template parameters dynamically from backend
  const { data: templateParamData, isLoading: paramsLoading } = useQuery({
    queryKey: ["/api/admin/whatsapp/template-parameters", selectedTemplate],
    enabled: !!selectedTemplate,
    queryFn: async () => {
      const response = await fetch(`/api/admin/whatsapp/template-parameters/${selectedTemplate}`);
      if (!response.ok) throw new Error("Failed to fetch template parameters");
      return response.json();
    }
  });

  const handleSend = async () => {
    // Validation checks
    if (!selectedUser || !selectedTemplate) {
      toast({
        title: "Validation Error",
        description: "Please select a user and template",
        variant: "destructive"
      });
      return;
    }

    // Validate required parameters are provided
    if (templateParamData?.parameterCount > 0) {
      const requiredParams = templateParamData?.requiredParameters || [];
      const missingParams = requiredParams.filter((param: string) => !parameters[param] || !parameters[param].trim());
      
      if (missingParams.length > 0) {
        toast({
          title: "Missing Parameters",
          description: `Please provide values for: ${missingParams.join(", ")}`,
          variant: "destructive"
        });
        return;
      }
    }

    setSending(true);
    try {
      // Build FormData if there are media files
      const hasMediaFiles = Object.keys(mediaFiles).length > 0;
      let body: string | FormData;
      let headers: Record<string, string> = {};

      if (hasMediaFiles) {
        const formData = new FormData();
        formData.append('userId', selectedUser);
        formData.append('templateName', selectedTemplate);
        formData.append('parameters', JSON.stringify(parameters));
        
        // Append media files
        Object.entries(mediaFiles).forEach(([paramName, file]) => {
          formData.append(`media_${paramName}`, file);
        });
        
        body = formData;
        // Don't set Content-Type, let browser set it with boundary
      } else {
        body = JSON.stringify({
          userId: selectedUser,
          templateName: selectedTemplate,
          parameters
        });
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch('/api/admin/whatsapp/send-template', {
        method: 'POST',
        headers,
        body
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Template Delivered",
          description: `Template "${selectedTemplate}" delivered to WhatsApp`
        });
        setSelectedUser("");
        setSelectedTemplate("");
        setParameters({});
        setMediaFiles({});
        onClose();
      } else {
        // Show actual error from backend
        const errorMsg = data.message || data.error || 'Template delivery failed';
        toast({
          title: "Delivery Failed",
          description: errorMsg,
          variant: "destructive"
        });
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

  // Dynamic parameter fields based on backend response
  const requiredParams = templateParamData?.required || [];
  const paramCount = templateParamData?.paramCount || 0;
  const parameterMetadata = templateParamData?.parameterMetadata || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-96 overflow-y-auto">
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
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value);
              setParameters({});  // Reset parameters when template changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template, idx) => (
                  <SelectItem key={idx} value={template.name}>
                    {template.name} {template.status && `(${template.status})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Info and Requirements */}
          {selectedTemplate && templateParamData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-blue-900">Template Information</div>
              <div className="text-xs space-y-1 text-blue-800">
                <p><strong>Language:</strong> {templateParamData.language}</p>
                <p><strong>Status:</strong> {templateParamData.status}</p>
                {paramCount > 0 && (
                  <p><strong>Required Parameters:</strong> {paramCount}</p>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Parameter Input Fields */}
          {selectedTemplate && paramsLoading && (
            <div className="text-sm text-gray-500">Loading template requirements...</div>
          )}

          {selectedTemplate && templateParamData && paramCount > 0 && (
            <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This template requires {paramCount} parameter(s)
              </div>
              {requiredParams.map((param: string, idx: number) => {
                const paramMeta = parameterMetadata[param];
                const isMediaParam = paramMeta?.type === 'media';
                const mediaType = paramMeta?.mediaType || 'image';
                
                return (
                  <div key={param} className="space-y-1">
                    <Label htmlFor={param} className="text-xs font-medium">
                      {isMediaParam ? (
                        <>Parameter {idx + 1}: {param} (Upload {mediaType}) *</>
                      ) : (
                        <>Parameter {idx + 1}: {param} *</>
                      )}
                    </Label>
                    
                    {isMediaParam ? (
                      <div className="relative">
                        <Input
                          id={param}
                          type="file"
                          accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : '*/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMediaFiles({ ...mediaFiles, [param]: file });
                            }
                          }}
                          className="text-sm"
                        />
                        {mediaFiles[param] && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            {mediaFiles[param].name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        id={param}
                        placeholder={`Enter ${param}`}
                        value={parameters[param] || ''}
                        onChange={(e) => setParameters({ ...parameters, [param]: e.target.value })}
                        required
                        className="text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedTemplate && templateParamData && paramCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">✓ No parameters required for this template</p>
            </div>
          )}

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
              disabled={sending || !selectedUser || !selectedTemplate || paramsLoading}
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
