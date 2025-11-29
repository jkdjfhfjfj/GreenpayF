import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, RefreshCw, Plus, Eye } from "lucide-react";

interface WhatsAppTemplate {
  id?: string;
  name: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'PAUSED';
  language?: string;
  category?: string;
  components?: any[];
}

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/whatsapp/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        toast({
          title: "Templates Loaded",
          description: `Found ${data.count} template(s) in Meta Business Manager`
        });
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Could not fetch templates from Meta. Check your credentials.",
        variant: "destructive",
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      'APPROVED': { variant: 'default', label: '✓ Approved' },
      'PENDING_REVIEW': { variant: 'secondary', label: '⏳ Pending' },
      'REJECTED': { variant: 'destructive', label: '✗ Rejected' },
      'DISABLED': { variant: 'outline', label: 'Disabled' },
      'PAUSED': { variant: 'outline', label: 'Paused' }
    };
    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                WhatsApp Template Manager
              </CardTitle>
              <CardDescription>
                View and manage your WhatsApp templates from Meta Business Manager
              </CardDescription>
            </div>
            <Button 
              onClick={fetchTemplates} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Templates'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No templates found</p>
              <p className="text-sm text-gray-400">Create templates first or load from Meta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template, idx) => (
                <div 
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {getStatusBadge(template.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Language:</strong> {template.language || 'N/A'}</p>
                        <p><strong>Category:</strong> {template.category || 'N/A'}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreview(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
              <Button
                onClick={() => setShowPreview(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Status</p>
                <p className="text-gray-600 mt-1">{selectedTemplate.status}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Language</p>
                <p className="text-gray-600 mt-1">{selectedTemplate.language || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Category</p>
                <p className="text-gray-600 mt-1">{selectedTemplate.category || 'N/A'}</p>
              </div>
            </div>

            {selectedTemplate.components && selectedTemplate.components.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">Components</p>
                <div className="space-y-2 bg-white p-3 rounded border">
                  {selectedTemplate.components.map((comp, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium text-gray-900 capitalize">{comp.type}:</p>
                      <p className="text-gray-600 ml-2">{comp.text || JSON.stringify(comp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> To edit this template, go to Meta Business Manager. Changes sync when you refresh.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
