import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Mail, Phone, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SupportTicketWithUser {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
}

interface TicketsResponse {
  tickets: SupportTicketWithUser[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SupportTicketManagement() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const [formPriority, setFormPriority] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TicketsResponse>({
    queryKey: ['support-tickets', page],
    queryFn: async () => {
      const response = await fetch(`/api/admin/support/tickets?page=${page}&limit=10`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
        }
        throw new Error("Failed to fetch");
      }
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest('PUT', `/api/admin/support/tickets/${values.id}`, {
        status: values.status,
        priority: values.priority,
        adminNotes: values.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ title: "Updated" });
      setSelectedId(null);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/support/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ title: "Deleted" });
      setSelectedId(null);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (error) return <div className="p-4 text-red-600">Error loading tickets</div>;
  if (isLoading) return <div className="p-4">Loading...</div>;

  const tickets = data?.tickets || [];
  const ticket = selectedId ? tickets.find(t => t.id === selectedId) : null;

  const handleSelectTicket = (t: SupportTicketWithUser) => {
    setSelectedId(t.id);
    setFormStatus(t.status);
    setFormPriority(t.priority);
    setFormNotes(t.adminNotes || "");
  };

  const handleSave = () => {
    if (!ticket) return;
    updateMutation.mutate({
      id: ticket.id,
      status: formStatus,
      priority: formPriority,
      notes: formNotes,
    });
  };

  const handleBack = () => {
    setSelectedId(null);
    setFormStatus("");
    setFormPriority("");
    setFormNotes("");
  };

  if (selectedId && ticket) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack}>← Back</Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Ticket Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-2xl">{ticket.issueType}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm mt-2 bg-white p-3 rounded border">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Status</Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Priority</Label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete ticket?")) {
                        deleteMutation.mutate(ticket.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Info Sidebar */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="font-medium text-sm">{ticket.user.fullName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-medium text-sm truncate">{ticket.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="font-medium text-sm">{ticket.user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Created</p>
                    <p className="font-medium text-sm">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <Badge variant="outline" className="w-full justify-center py-2">
                    ID: {ticket.id.substring(0, 8)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Support Tickets</h2>
          <p className="text-gray-600 text-sm mt-1">{data?.total || 0} total tickets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tickets</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 border rounded-lg hover:shadow-lg transition-all bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{t.issueType}</h3>
                        <Badge variant={t.status === 'open' ? 'destructive' : 'outline'}>
                          {t.status}
                        </Badge>
                        <Badge variant={t.priority === 'urgent' ? 'destructive' : 'default'}>
                          {t.priority}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-700">{t.description.substring(0, 100)}...</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                          <span>👤 {t.user.fullName}</span>
                          <span>📧 {t.user.email}</span>
                          <span>📞 {t.user.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSelectTicket(t)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex gap-2 mt-6">
              <Button
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </Button>
              <span className="text-sm py-2">
                {page} / {data.totalPages}
              </span>
              <Button
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
