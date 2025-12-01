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
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
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
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickets
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
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminAuth");
          window.location.href = "/admin/login";
        }
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 1,
  });

  // Update ticket
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: any }) => {
      return apiRequest('PUT', `/api/admin/support/tickets/${ticketId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  // Delete ticket
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest('DELETE', `/api/admin/support/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    },
  });

  // Cleanup notifications
  const cleanupNotificationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/cleanup-ticket-notifications');
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Deleted ${data.deletedCount || 0} notifications`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cleanup notifications",
        variant: "destructive",
      });
    },
  });

  // Dialog handlers
  const handleOpenDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.adminNotes || "");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTicket(null);
    setAdminNotes("");
  };

  const handleUpdateTicket = () => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      updates: {
        status: selectedTicket.status,
        priority: selectedTicket.priority,
        adminNotes: adminNotes.trim() || null,
      },
    });
  };

  const handleDeleteTicket = () => {
    if (!selectedTicket) return;
    
    if (confirm('Are you sure? This cannot be undone.')) {
      deleteTicketMutation.mutate(selectedTicket.id);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedTicket) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handlePriorityChange = (newPriority: string) => {
    if (selectedTicket) {
      setSelectedTicket({ ...selectedTicket, priority: newPriority });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Failed to load tickets</p>
          <p className="text-red-600 text-sm mt-1">{String(error)}</p>
          <Button onClick={() => refetch()} className="mt-3">Retry</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  const tickets = ticketsData?.tickets || [];
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Manage user support requests</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {openCount} open
          </Badge>
          <Badge variant="outline" className="text-sm">
            {inProgressCount} in progress
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Delete all ticket notifications?')) {
                cleanupNotificationsMutation.mutate();
              }
            }}
            disabled={cleanupNotificationsMutation.isPending}
          >
            {cleanupNotificationsMutation.isPending ? "Cleaning..." : "Cleanup"}
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
              />
            </div>
            
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

            {(statusFilter || priorityFilter || search) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setSearch("");
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
          <CardDescription>
            {ticketsData?.total || 0} total tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets found</p>
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
                    <TableCell>
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(ticket)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
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

      {/* Ticket Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Type</Label>
                  <p className="font-medium mt-1">{selectedTicket.issueType}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="font-medium mt-1">
                    {format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status">
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={selectedTicket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger id="priority">
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
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDeleteTicket}
                  disabled={deleteTicketMutation.isPending}
                >
                  {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateTicket}
                    disabled={updateTicketMutation.isPending}
                  >
                    {updateTicketMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
