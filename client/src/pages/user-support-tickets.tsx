import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TicketReply {
  id: string;
  content: string;
  senderType: "user" | "admin";
  createdAt: string;
  fileUrl?: string;
}

interface SupportTicket {
  id: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  replies?: TicketReply[];
}

interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
}

export default function UserSupportTickets() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createData, setCreateData] = useState({ issueType: "", description: "", file: null as File | null });
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TicketsResponse>({
    queryKey: ['user-support-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/user/support-tickets', {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('issueType', createData.issueType);
      formData.append('description', createData.description);
      if (createData.file) formData.append('file', createData.file);

      const response = await fetch('/api/user/support-tickets', {
        method: 'POST',
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
      toast({ title: "Ticket created successfully" });
      setCreateData({ issueType: "", description: "", file: null });
      setShowCreateForm(false);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('content', replyText);
      if (replyFile) formData.append('file', replyFile);

      const response = await fetch(`/api/user/support-tickets/${selectedId}/reply`, {
        method: 'POST',
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to send reply");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
      toast({ title: "Reply sent" });
      setReplyText("");
      setReplyFile(null);
    },
    onError: () => toast({ title: "Error sending reply", variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const tickets = data?.tickets || [];
  const selectedTicket = selectedId ? tickets.find(t => t.id === selectedId) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (selectedTicket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Button variant="outline" onClick={() => setSelectedId(null)}>← Back to Tickets</Button>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{selectedTicket.issueType}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={selectedTicket.status === 'open' ? 'destructive' : 'outline'}>
                  {selectedTicket.status}
                </Badge>
                <Badge variant={selectedTicket.priority === 'urgent' ? 'destructive' : 'default'}>
                  {selectedTicket.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-2 p-3 bg-white rounded border">{selectedTicket.description}</p>
            </div>

            <div className="text-xs text-gray-500">
              Created {format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTicket.replies || selectedTicket.replies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No replies yet</p>
            ) : (
              <div className="space-y-3">
                {selectedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg ${
                      reply.senderType === 'admin'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {reply.senderType === 'admin' ? '👨‍💼 Support Team' : '👤 You'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(reply.createdAt), 'MMM d HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                    {reply.fileUrl && (
                      <a href={reply.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 inline-block">
                        📎 View attachment
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reply">Your Message</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="file">Attach File (Optional)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>

            <Button
              onClick={() => replyMutation.mutate()}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {replyMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Support Tickets
          </h1>
          <p className="text-gray-600 text-sm mt-1">Track and manage your support requests</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" /> New Ticket
        </Button>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type">Issue Type</Label>
              <Input
                id="type"
                placeholder="e.g., Payment Issue, Technical Problem, Account Help"
                value={createData.issueType}
                onChange={(e) => setCreateData({ ...createData, issueType: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="Describe your issue in detail..."
                value={createData.description}
                onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="attach">Attach File (Optional)</Label>
              <Input
                id="attach"
                type="file"
                onChange={(e) => setCreateData({ ...createData, file: e.target.files?.[0] || null })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!createData.issueType || !createData.description || createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No tickets yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a new ticket to get support</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50"
              onClick={() => setSelectedId(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="font-bold text-lg">{ticket.issueType}</h3>
                      <Badge variant={ticket.status === 'open' ? 'destructive' : 'outline'}>
                        {ticket.status}
                      </Badge>
                      <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'default'}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{ticket.description.substring(0, 150)}...</p>
                    <p className="text-xs text-gray-500">
                      Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
