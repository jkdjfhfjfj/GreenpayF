import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";
import { useState, useEffect } from "react";
import { Copy, Eye, EyeOff, Plus, Trash2, CheckCircle, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiKey {
  id: string;
  name: string;
  isActive: boolean;
  scope: string[];
  rateLimit: number;
  createdAt: string;
  lastUsedAt?: string;
}

export default function APIServicePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    scopes: ["read", "write"],
    rateLimit: "1000",
  });
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/api-keys", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error ${response.status}:`, errorData);
        
        if (response.status === 401) {
          toast({
            description: "Please log in to view API keys",
            variant: "destructive",
          });
        } else if (response.status === 403) {
          toast({
            description: "You need admin privileges to manage API keys",
            variant: "destructive",
          });
        } else {
          toast({
            description: errorData.message || errorData.error || "Failed to load API keys",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast({
        description: "Network error loading API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        description: "Please enter a key name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/api-keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          scope: formData.scopes,
          rateLimit: parseInt(formData.rateLimit),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewKey(data.key);
        setFormData({ name: "", scopes: ["read", "write"], rateLimit: "1000" });
        toast({
          description: "API key generated successfully! Copy it now.",
        });
        await fetchApiKeys();
      } else {
        toast({
          description: data.error || "Failed to generate key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        description: "Error generating API key",
        variant: "destructive",
      });
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/revoke`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({ description: "API key revoked successfully" });
        await fetchApiKeys();
      } else {
        toast({
          description: "Failed to revoke key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        description: "Error revoking API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <WavyHeader
        title="API Services"
        onBack={() => setLocation("/dashboard")}
        size="md"
      />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* API Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">GreenPay API</h2>
              <p className="text-muted-foreground mb-4">
                Integrate GreenPay's payment services into your applications.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => setLocation("/api-documentation")}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </div>
            </div>
            <Code className="w-16 h-16 text-primary/30" />
          </div>
        </motion.div>

        {/* API Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              title: "RESTful API",
              description: "Modern REST endpoints for all operations",
            },
            {
              title: "Rate Limiting",
              description: "Flexible rate limits based on your plan",
            },
            {
              title: "Webhook Support",
              description: "Real-time event notifications",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-card rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Generate New Key Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-primary via-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Generate New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
              </DialogHeader>

              {newKey ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">
                      Your API key has been generated!
                    </p>
                    <div className="bg-background p-3 rounded font-mono text-sm break-all border border-border mb-3">
                      {newKey}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Copy this key now. You won't be able to see it again!
                    </p>
                    <Button
                      onClick={() => copyToClipboard(newKey)}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewKey(null);
                      setGenerateDialogOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={generateApiKey} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Key Name
                    </label>
                    <Input
                      placeholder="e.g., Mobile App, Backend Service"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Rate Limit (requests/minute)
                    </label>
                    <Select
                      value={formData.rateLimit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, rateLimit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1,000</SelectItem>
                        <SelectItem value="5000">5,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Scopes
                    </label>
                    <div className="space-y-2">
                      {["read", "write"].map((scope) => (
                        <label key={scope} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.scopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  scopes: [...formData.scopes, scope],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  scopes: formData.scopes.filter(
                                    (s) => s !== scope
                                  ),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Generate Key
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* API Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold">Your API Keys</h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin">⏳</div>
              <p className="text-muted-foreground mt-2">Loading keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">
                No API keys yet. Generate one to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-card rounded-lg border border-border p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{key.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          key.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                        }`}
                      >
                        {key.isActive ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Scopes: {key.scope.join(", ")}</span>
                      <span>Rate: {key.rateLimit}/min</span>
                      {key.lastUsedAt && (
                        <span>
                          Last used:{" "}
                          {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {key.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeApiKey(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* API Endpoints Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg border border-border p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              "POST /api/auth/signup",
              "POST /api/auth/login",
              "POST /api/transactions/send",
              "GET /api/exchange-rates/:from/:to",
              "POST /api/deposit/initialize-payment",
              "POST /api/airtime/purchase",
              "GET /api/notifications",
              "POST /api/support/tickets",
            ].map((endpoint, idx) => (
              <div
                key={idx}
                className="bg-muted/50 rounded p-3 font-mono text-xs"
              >
                {endpoint}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            See the full API documentation for all 30+ endpoints and examples.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
