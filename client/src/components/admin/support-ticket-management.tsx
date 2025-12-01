import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  Save
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  assignedAdminId: string | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SupportTicketManagement() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading, error, refetch } = useQuery<TicketsResponse>({
    queryKey: ['/api/admin/support/tickets', { statusFilter, priorityFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminAuth");
          window.location.href = "/admin/login";
        }
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 1,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: any }) => {
      return apiRequest('PUT', `/api/admin/support/tickets/${ticketId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({ title: "Success", description: "Ticket updated" });
      setEditingId(null);
      setEditData({});
    },
    onError: () => {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest('DELETE', `/api/admin/support/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({ title: "Success", description: "Ticket deleted" });
      setExpandedId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/cleanup-ticket-notifications');
    },
    onSuccess: (data: any) => {
      toast({ title: "Success", description: `Deleted ${data.deletedCount || 0} notifications` });
    },
    onError: () => {
      toast({ title: "Error", description: "Cleanup failed", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'open': return "destructive";
      case 'in_progress': return "default";
      case 'resolved': return "secondary";
      case 'closed': return "outline";
      default: return "outline";
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'low': return "outline";
      case 'medium': return "default";
      case 'high': return "secondary";
      case 'urgent': return "destructive";
      default: return "outline";
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Failed to load tickets</p>
        <Button onClick={() => refetch()} className="mt-3">Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  const tickets = ticketsData?.tickets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage user support requests</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Delete all ticket notifications?')) {
              cleanupMutation.mutate();
            }
          }}
          disabled={cleanupMutation.isPending}
        >
          {cleanupMutation.isPending ? "Cleaning..." : "Cleanup"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter || priorityFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>{ticketsData?.total || 0} total tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <div key={ticket.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                        >
                          {expandedId === ticket.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{ticket.id.substring(0, 8)}...</TableCell>
                      <TableCell>{ticket.issueType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <Badge variant={getStatusVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(ticket.createdAt), 'MMM d HH:mm')}
                      </TableCell>
                    </TableRow>

                    {expandedId === ticket.id && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="bg-gray-50 p-6 space-y-4">
                            <div>
                              <Label className="text-sm font-semibold">Description</Label>
                              <p className="text-sm mt-1 text-gray-700">{ticket.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`status-${ticket.id}`} className="text-sm">Status</Label>
                                <Select
                                  value={editingId === ticket.id ? editData.status || ticket.status : ticket.status}
                                  onValueChange={(val) => {
                                    if (editingId !== ticket.id) setEditingId(ticket.id);
                                    setEditData({ ...editData, status: val, adminNotes: ticket.adminNotes });
                                  }}
                                >
                                  <SelectTrigger id={`status-${ticket.id}`} className="mt-1">
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
                                <Label htmlFor={`priority-${ticket.id}`} className="text-sm">Priority</Label>
                                <Select
                                  value={editingId === ticket.id ? editData.priority || ticket.priority : ticket.priority}
                                  onValueChange={(val) => {
                                    if (editingId !== ticket.id) setEditingId(ticket.id);
                                    setEditData({ ...editData, priority: val, adminNotes: ticket.adminNotes });
                                  }}
                                >
                                  <SelectTrigger id={`priority-${ticket.id}`} className="mt-1">
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
                              <Label htmlFor={`notes-${ticket.id}`} className="text-sm">Admin Notes</Label>
                              <Textarea
                                id={`notes-${ticket.id}`}
                                placeholder="Add notes..."
                                value={editingId === ticket.id ? editData.adminNotes || "" : ticket.adminNotes || ""}
                                onChange={(e) => {
                                  if (editingId !== ticket.id) setEditingId(ticket.id);
                                  setEditData({ ...editData, adminNotes: e.target.value });
                                }}
                                rows={3}
                                className="mt-1 text-sm"
                              />
                            </div>

                            <div className="flex justify-between pt-4 border-t">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Delete this ticket?')) {
                                    deleteTicketMutation.mutate(ticket.id);
                                  }
                                }}
                                disabled={deleteTicketMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditData({});
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateTicketMutation.mutate({
                                      ticketId: ticket.id,
                                      updates: {
                                        status: editData.status || ticket.status,
                                        priority: editData.priority || ticket.priority,
                                        adminNotes: editData.adminNotes || ticket.adminNotes,
                                      },
                                    });
                                  }}
                                  disabled={updateTicketMutation.isPending}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  {updateTicketMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </div>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {ticketsData && ticketsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {ticketsData.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= ticketsData.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
