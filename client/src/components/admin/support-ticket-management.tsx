import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SupportTicket {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  createdAt: string;
}

interface TicketsResponse {
  tickets: SupportTicket[];
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

  const { data, isLoading, error, refetch } = useQuery<TicketsResponse>({
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

  const handleSelectTicket = (t: SupportTicket) => {
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
        
        <Card>
          <CardHeader>
            <CardTitle>{ticket.issueType}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">ID</p>
              <p className="font-mono text-sm">{ticket.id}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm">{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-sm">{ticket.description}</p>
            </div>

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

            <div>
              <Label htmlFor="notes" className="text-sm">Notes</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1"
                rows={3}
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
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <p className="text-gray-600 text-sm">{data?.total || 0} total</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-gray-500">No tickets</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 border rounded flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{t.issueType}</p>
                    <p className="text-sm text-gray-600">{t.id.substring(0, 8)}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={t.status === 'open' ? 'destructive' : 'outline'}>
                        {t.status}
                      </Badge>
                      <Badge variant={t.priority === 'urgent' ? 'destructive' : 'default'}>
                        {t.priority}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSelectTicket(t)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex gap-2 mt-4">
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
