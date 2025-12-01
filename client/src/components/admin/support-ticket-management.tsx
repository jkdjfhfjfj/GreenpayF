import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Mail, Phone, User, Calendar, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  userId: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    phone: string;
  };
  replies?: TicketReply[];
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
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<TicketsResponse>({
    queryKey: ['support-tickets', page],
    queryFn: async () => {
      const response = await fetch(`/api/admin/support/tickets?page=${page}&limit=10`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
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
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('content', replyText);
      if (replyFile) formData.append('file', replyFile);
      const response = await fetch(`/api/admin/support-tickets/${selectedId}/reply`, {
        method: 'POST',
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to send reply");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ title: "Reply sent" });
      setReplyText("");
      setReplyFile(null);
    },
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
  });

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

  if (selectedId && ticket) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedId(null)} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">← Back</Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Main Ticket */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
                <CardTitle className="text-2xl">{ticket.issueType}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Description</p>
                  <p className="text-sm mt-2 bg-white p-4 rounded-lg border-l-4 border-emerald-500">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-emerald-800">Status</Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger className="mt-1 border-emerald-200">
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
                    <Label className="text-sm font-semibold text-emerald-800">Priority</Label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger className="mt-1 border-emerald-200">
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
                  <Label htmlFor="notes" className="text-sm font-semibold text-emerald-800">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1 border-emerald-200"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedId(null)} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete ticket?")) {
                        deleteMutation.mutate(ticket.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-green-50 border-b border-emerald-200">
                <CardTitle className="text-emerald-800">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 max-h-64 overflow-y-auto">
                {!ticket.replies || ticket.replies.length === 0 ? (
                  <p className="text-emerald-600 text-center py-8">No replies yet</p>
                ) : (
                  ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg text-sm ${
                        reply.senderType === 'admin'
                          ? 'bg-emerald-50 border-l-4 border-emerald-500 ml-4'
                          : 'bg-white border-l-4 border-emerald-300 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs text-emerald-800">
                          {reply.senderType === 'admin' ? '👨‍💼 Admin' : '👤 User'}
                        </span>
                        <span className="text-xs text-emerald-600">{format(new Date(reply.createdAt), 'MMM d HH:mm')}</span>
                      </div>
                      <p className="text-sm text-gray-800">{reply.content}</p>
                      {reply.fileUrl && (
                        <a href={reply.fileUrl} target="_blank" className="text-xs text-emerald-600 mt-1 inline-block font-semibold hover:underline">
                          📎 {reply.fileName}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Reply Form */}
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-green-50 border-b border-emerald-200">
                <CardTitle className="text-emerald-800">Send Reply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="text-sm border-emerald-200"
                />
                <div className="flex gap-2">
                  <Input
                    type="file"
                    onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                    className="text-sm border-emerald-200 flex-1"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                  {replyFile && (
                    <span className="text-xs text-emerald-600 self-center px-2 font-semibold">✓ {replyFile.name}</span>
                  )}
                </div>
                <Button
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* User Info Sidebar */}
          <Card className="border-2 border-emerald-200 h-fit bg-gradient-to-br from-emerald-50 to-green-50">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {ticket.user && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4 border-emerald-500">
                    <User className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-700">Full Name</p>
                      <p className="font-semibold text-sm truncate">{ticket.user.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4 border-emerald-500">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-700">Email</p>
                      <p className="font-semibold text-sm truncate">{ticket.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4 border-emerald-500">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-700">Phone</p>
                      <p className="font-semibold text-sm">{ticket.user.phone}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4 border-emerald-500">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-xs text-emerald-700">Created</p>
                  <p className="font-semibold text-sm">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <Badge className="w-full justify-center py-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">ID: {ticket.id.substring(0, 8)}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Support Tickets</h2>
          <p className="text-emerald-700 text-sm mt-1">{data?.total || 0} total tickets</p>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
          <CardTitle className="text-emerald-800">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {tickets.length === 0 ? (
            <p className="text-emerald-600 text-center py-8">No tickets</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 border border-emerald-200 rounded-lg hover:shadow-lg transition-all bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 cursor-pointer"
                  onClick={() => handleSelectTicket(t)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-emerald-900">{t.issueType}</h3>
                        <Badge className="bg-emerald-600 text-white">
                          {t.status}
                        </Badge>
                        <Badge className="bg-emerald-500 text-white">
                          {t.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-800 mb-2">{t.description.substring(0, 80)}...</p>
                      <div className="flex items-center gap-4 text-xs text-emerald-700">
                        {t.user && (
                          <>
                            <span>👤 {t.user.fullName}</span>
                            <span>📧 {t.user.email}</span>
                          </>
                        )}
                        <span>{format(new Date(t.createdAt), 'MMM d')}</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">View</Button>
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
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
              >
                Prev
              </Button>
              <span className="text-sm py-2 text-emerald-700 font-semibold">{page} / {data.totalPages}</span>
              <Button
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
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
