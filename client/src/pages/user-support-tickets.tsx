import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card shadow-sm p-4 flex items-center elevation-1 border-b border-border"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedId(null)}
            className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          >
            arrow_back
          </motion.button>
          <div>
            <h1 className="text-lg font-semibold">{selectedTicket.issueType}</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className={`${getStatusColor(selectedTicket.status)} border text-xs`}>
              {selectedTicket.status}
            </Badge>
            <Badge variant="outline" className="text-xs">{selectedTicket.priority}</Badge>
          </div>
        </motion.div>

        <div className="p-4 space-y-4 max-w-full">
          {/* Ticket Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-4 rounded-xl border border-border elevation-1"
          >
            <p className="text-sm font-semibold text-muted-foreground mb-2">ISSUE DESCRIPTION</p>
            <p className="text-sm text-foreground">{selectedTicket.description}</p>
          </motion.div>

          {/* Conversation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border elevation-1"
          >
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-muted-foreground">CONVERSATION ({selectedTicket.replies?.length || 0})</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-3">
              {!selectedTicket.replies || selectedTicket.replies.length === 0 ? (
                <p className="text-muted-foreground text-center py-6 text-sm">No replies yet</p>
              ) : (
                selectedTicket.replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg text-sm ${
                      reply.senderType === 'admin'
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'bg-muted border-l-4 border-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-xs">{reply.senderType === 'admin' ? '👨‍💼 Support' : '👤 You'}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(reply.createdAt), 'MMM d HH:mm')}</span>
                    </div>
                    <p className="text-foreground">{reply.content}</p>
                    {reply.fileUrl && (
                      <a href={reply.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-2 inline-block hover:underline">
                        📎 {reply.fileName || 'Download'}
                      </a>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Reply Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-4 rounded-xl border border-border elevation-1"
          >
            <p className="text-sm font-semibold text-muted-foreground mb-3">SEND REPLY</p>
            <div className="space-y-3">
              <Textarea
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="text-sm rounded-lg"
              />
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  onChange={(e) => setReplyFile(e.target.files?.[0] || null)} 
                  className="text-sm flex-1"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                {replyFile && (
                  <span className="text-xs text-primary self-center px-2">✓ {replyFile.name}</span>
                )}
              </div>
              <Button
                onClick={() => replyMutation.mutate()}
                disabled={!replyText.trim() || replyMutation.isPending}
                className="w-full ripple"
              >
                <span className="material-icons text-sm mr-2">send</span>
                {replyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center justify-between elevation-1 border-b border-border"
      >
        <div>
          <h1 className="text-lg font-semibold">Support Tickets</h1>
          <p className="text-xs text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation('/support')}
          className="material-icons text-muted-foreground p-2 rounded-full hover:bg-muted transition-colors"
        >
          close
        </motion.button>
      </motion.div>

      <div className="p-4 space-y-3">
        {tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card p-6 rounded-xl text-center border border-border elevation-1"
          >
            <span className="material-icons text-4xl text-muted-foreground mb-2 inline-block">inbox</span>
            <p className="text-muted-foreground font-semibold text-sm">No support tickets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Visit the support page to report an issue</p>
          </motion.div>
        ) : (
          tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all border border-border bg-card elevation-1"
                onClick={() => setSelectedId(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-semibold text-sm truncate">{ticket.issueType}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{format(new Date(ticket.createdAt), 'MMM d')}</span>
                        <span className="text-primary font-semibold">{ticket.replies?.length || 0} replies</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Badge className={`${getStatusColor(ticket.status)} border text-xs`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
