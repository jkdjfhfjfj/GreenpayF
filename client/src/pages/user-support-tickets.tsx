import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface TicketReply {
  id: string;
  content: string;
  senderType: "user" | "admin";
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
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
}

export default function UserSupportTickets() {
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TicketsResponse>({
    queryKey: ['user-support-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/user/support-tickets', { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
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
      toast({ title: "Reply sent successfully" });
      setReplyText("");
      setReplyFile(null);
    },
    onError: (error) => {
      console.error('Reply error:', error);
      toast({ title: "Failed to send reply", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const tickets = data?.tickets || [];
  const selectedTicket = selectedId ? tickets.find(t => t.id === selectedId) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
      case 'closed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'closed': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
          <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 hover:opacity-80">
            <span>←</span>
            <span>Back to Tickets</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Ticket Card */}
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {getStatusIcon(selectedTicket.status)}
                    {selectedTicket.issueType}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getStatusColor(selectedTicket.status)} border`}>
                    {selectedTicket.status}
                  </Badge>
                  <Badge variant={selectedTicket.priority === 'urgent' ? 'destructive' : 'outline'}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                  <p className="text-sm bg-white p-4 rounded-lg border-l-4 border-indigo-500">{selectedTicket.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="text-lg">Conversation ({selectedTicket.replies?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 max-h-80 overflow-y-auto space-y-3">
              {!selectedTicket.replies || selectedTicket.replies.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No replies yet</p>
              ) : (
                selectedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg ${
                      reply.senderType === 'admin'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm">{reply.senderType === 'admin' ? '👨‍💼 Support Team' : '👤 You'}</span>
                      <span className="text-xs text-gray-500">{format(new Date(reply.createdAt), 'MMM d HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-800">{reply.content}</p>
                    {reply.fileUrl && (
                      <a href={reply.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 inline-block hover:underline">
                        📎 {reply.fileName || 'Download'}
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card className="shadow-lg border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
              <CardTitle className="text-lg">Send Reply</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Input type="file" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} className="text-sm" />
              <Button
                onClick={() => replyMutation.mutate()}
                disabled={!replyText.trim() || replyMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {replyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Support Tickets</h1>
          <p className="text-blue-100 text-sm">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setLocation('/support')} className="opacity-80 hover:opacity-100">←</button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-semibold">No issues reported yet</p>
                <p className="text-sm text-gray-400 mt-1">Click on the Support page to report an issue</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 hover:border-indigo-300 shadow-md"
                onClick={() => setSelectedId(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-bold text-lg">{ticket.issueType}</h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{ticket.description.substring(0, 100)}...</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600">
                          {ticket.replies?.length || 0} replies
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
