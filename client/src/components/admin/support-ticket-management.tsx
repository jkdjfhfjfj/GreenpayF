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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  MessageSquare,
  UserCheck,
  AlertTriangle
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading, error } = useQuery<TicketsResponse>({
    queryKey: ['/api/admin/support/tickets', { status, priority, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      try {
        const response = await fetch(`/api/admin/support/tickets?${params}`, {
          credentials: "include"
        });
        if (!response.ok) {
          if (response.status === 401) {
            // Admin session expired
            localStorage.removeItem("adminAuth");
            window.location.href = "/admin/login";
            throw new Error('Admin session expired');
          }
          const errorText = await response.text();
          console.error('Tickets API error:', response.status, errorText);
          throw new Error(`Failed to fetch tickets: ${response.status}`);
        }
        const data = await response.json();
        console.log('Tickets data received:', data);
        return data;
      } catch (err) {
        console.error('Tickets fetch error:', err);
        throw err;
      }
    },
    retry: false,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: any }) => {
      return apiRequest('PUT', `/api/admin/support/tickets/${ticketId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({
        title: "Ticket updated successfully",
        description: "The support ticket has been updated.",
      });
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update the support ticket.",
        variant: "destructive",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest('DELETE', `/api/admin/support/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({
        title: "Ticket deleted successfully",
        description: "The support ticket has been deleted.",
      });
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the support ticket.",
        variant: "destructive",
      });
    },
  });

  const cleanupNotificationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/cleanup-ticket-notifications');
    },
    onSuccess: (data: any) => {
      toast({
        title: "Cleanup completed successfully",
        description: `Deleted ${data.deletedCount} ticket-related notifications.`,
      });
    },
    onError: () => {
      toast({
        title: "Cleanup failed",
        description: "Failed to cleanup ticket notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      open: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline"
    };
    return variants[status] || "outline";
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      low: "outline",
      medium: "default",
      high: "secondary",
      urgent: "destructive"
    };
    return variants[priority] || "outline";
  };

  const handleUpdateTicket = (ticket: SupportTicket) => {
    const updates: any = {
      status: selectedTicket?.status || ticket.status,
      priority: selectedTicket?.priority || ticket.priority,
    };

    if (adminNotes.trim()) {
      updates.adminNotes = adminNotes.trim();
    }

    updateTicketMutation.mutate({
      ticketId: ticket.id,
      updates,
    });
  };

  const tickets = ticketsData?.tickets || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage and respond to user support requests</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {tickets.filter(t => t.status === 'open').length} open tickets
          </Badge>
          <Badge variant="outline" className="text-sm">
            {tickets.filter(t => t.status === 'in_progress').length} in progress
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('This will delete all ticket-related notifications for all users. Are you sure?')) {
                cleanupNotificationsMutation.mutate();
              }
            }}
            disabled={cleanupNotificationsMutation.isPending}
            data-testid="button-cleanup-notifications"
            title="Clean up old ticket notifications"
          >
            {cleanupNotificationsMutation.isPending ? "Cleaning..." : "Cleanup Notifications"}
          </Button>
        </div>
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
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-tickets"
              />
            </div>
            
            <Select value={status} onValueChange={setStatus}>
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

            <Select value={priority} onValueChange={setPriority}>
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

            {(status || priority) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("");
                  setPriority("");
                  setSearch("");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            {ticketsData?.total || 0} total tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p data-testid="text-no-tickets">No support tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.issueType}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <Badge variant={getStatusBadge(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setAdminNotes(ticket.adminNotes || "");
                            }}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Support Ticket Details
                            </DialogTitle>
                            <DialogDescription>
                              Ticket ID: {ticket.id}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedTicket && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Issue Type</Label>
                                  <p className="font-medium">{selectedTicket.issueType}</p>
                                </div>
                                <div>
                                  <Label>Created</Label>
                                  <p>{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}</p>
                                </div>
                              </div>

                              <div>
                                <Label>Description</Label>
                                <Card className="mt-2">
                                  <CardContent className="p-4">
                                    <p className="text-sm text-gray-700">
                                      {selectedTicket.description}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Status</Label>
                                  <Select
                                    value={selectedTicket.status}
                                    onValueChange={(value) => 
                                      setSelectedTicket({...selectedTicket, status: value})
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <Label>Priority</Label>
                                  <Select
                                    value={selectedTicket.priority}
                                    onValueChange={(value) => 
                                      setSelectedTicket({...selectedTicket, priority: value})
                                    }
                                  >
                                    <SelectTrigger>
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
                                <Label>Admin Notes</Label>
                                <Textarea
                                  placeholder="Add notes about this ticket..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={4}
                                  className="mt-2"
                                  data-testid="textarea-admin-notes"
                                />
                              </div>

                              <div className="flex justify-between">
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
                                      deleteTicketMutation.mutate(selectedTicket.id);
                                    }
                                  }}
                                  disabled={deleteTicketMutation.isPending}
                                  data-testid="button-delete-ticket"
                                >
                                  {deleteTicketMutation.isPending ? "Deleting..." : "Delete Ticket"}
                                </Button>
                                
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedTicket(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleUpdateTicket(selectedTicket)}
                                    disabled={updateTicketMutation.isPending}
                                    data-testid="button-update-ticket"
                                  >
                                    {updateTicketMutation.isPending ? "Updating..." : "Update Ticket"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
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