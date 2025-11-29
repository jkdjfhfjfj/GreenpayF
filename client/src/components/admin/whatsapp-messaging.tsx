import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Phone, Clock, CheckCircle2, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface WhatsAppConversation {
  id: string;
  phoneNumber: string;
  displayName?: string;
  lastMessageAt?: string;
  status: string;
}

interface WhatsAppMessage {
  id: string;
  conversationId: string;
  phoneNumber: string;
  content: string;
  isFromAdmin: boolean;
  status: string;
  createdAt: string;
}

export default function WhatsAppMessaging() {
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load messaging settings to check if WhatsApp is configured
  const { data: messagingSettings } = useQuery({
    queryKey: ['/api/admin/messaging-settings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/messaging-settings");
      return response.json();
    },
  });

  useEffect(() => {
    if (messagingSettings?.whatsappAccessToken && messagingSettings?.whatsappPhoneNumberId) {
      setWhatsappConfigured(true);
    } else {
      setWhatsappConfigured(false);
    }
  }, [messagingSettings]);

  const { data: conversations = [] } = useQuery<WhatsAppConversation[]>({
    queryKey: ['/api/admin/whatsapp/conversations'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/whatsapp/conversations");
      return response.json();
    },
    refetchInterval: 3000,
  });

  const { data: messages = [] } = useQuery<WhatsAppMessage[]>({
    queryKey: ['/api/admin/whatsapp/messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await apiRequest("GET", `/api/admin/whatsapp/messages/${selectedConversationId}`);
      return response.json();
    },
    enabled: !!selectedConversationId,
    refetchInterval: 2000,
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const sendMutation = useMutation({
    mutationFn: async (data: { conversationId: string; phoneNumber: string; message: string; mediaUrl?: string; mediaType?: string }) => {
      const response = await apiRequest("POST", "/api/admin/whatsapp/send", data);
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      setMediaFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/messages', selectedConversationId] });
      toast({
        title: "Message sent",
        description: "WhatsApp message sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageText.trim()) return;

    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (!conversation) return;

    let mediaUrl = undefined;
    let mediaType = undefined;

    if (mediaFile) {
      // Upload media to Cloudinary
      const formData = new FormData();
      formData.append('file', mediaFile);
      
      try {
        const uploadResponse = await apiRequest("POST", "/api/upload", formData);
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        const uploadData = await uploadResponse.json();
        mediaUrl = uploadData.fileUrl || uploadData.url;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 
                   mediaFile.type.startsWith('video/') ? 'video' : 'file';
        console.log('[WhatsApp] Media uploaded:', { mediaUrl, mediaType });
      } catch (err: any) {
        console.error('[WhatsApp] Media upload error:', err);
        toast({
          title: "Error",
          description: err.message || "Failed to upload media file",
          variant: "destructive",
        });
        return;
      }
    }

    sendMutation.mutate({
      conversationId: selectedConversationId,
      phoneNumber: conversation.phoneNumber,
      message: messageText.trim(),
      mediaUrl,
      mediaType,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (!whatsappConfigured) {
    return (
      <div className="space-y-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-lg">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">WhatsApp Not Configured</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Please configure your WhatsApp Business credentials in the Messaging Settings to start messaging users.
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setLocation("/admin/mail-management?tab=messaging-settings")}
                >
                  Go to Messaging Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-4 h-4" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[530px]">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet</div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversationId === conv.id
                        ? 'bg-green-100 border-l-4 border-green-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.displayName || conv.phoneNumber}</p>
                        <p className="text-xs text-gray-500">{conv.phoneNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{conv.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedConversation.displayName || selectedConversation.phoneNumber}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{selectedConversation.phoneNumber}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col h-[540px] p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No messages yet</div>
                  ) : (
                    [...messages].reverse().map(msg => {
                      // Parse media URLs from message content
                      const urlRegex = /(https?:\/\/[^\s\n]+)/g;
                      const urls = msg.content.match(urlRegex) || [];
                      const textContent = msg.content.replace(urlRegex, '').trim();
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg space-y-2 ${
                              msg.isFromAdmin
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {textContent && <p className="text-sm">{textContent}</p>}
                            {urls.map((url, idx) => {
                              const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(url);
                              const isVideo = /\.(mp4|mov|avi|webm)/i.test(url);
                              const isPdf = /\.pdf$/i.test(url);
                              
                              if (isImage) {
                                return (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="Message media"
                                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 max-h-64"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                );
                              } else if (isVideo) {
                                return (
                                  <video
                                    key={idx}
                                    controls
                                    className="max-w-full h-auto rounded"
                                    style={{ maxHeight: '200px' }}
                                  >
                                    <source src={url} type="video/mp4" />
                                  </video>
                                );
                              } else {
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs underline break-all hover:opacity-80"
                                  >
                                    {isPdf ? '📄 PDF Document' : '📎 Download File'}
                                  </a>
                                );
                              }
                            })}
                            <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                              <Clock className="w-3 h-3" />
                              {format(new Date(msg.createdAt), 'HH:mm')}
                              {msg.isFromAdmin && msg.status === 'sent' && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4 space-y-2">
                {mediaFile && (
                  <div className="text-xs bg-blue-50 p-2 rounded flex justify-between items-center">
                    <span>📎 {mediaFile.name}</span>
                    <button 
                      onClick={() => setMediaFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMutation.isPending}
                  />
                  <input
                    type="file"
                    id="media-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setMediaFile(e.target.files[0]);
                      }
                    }}
                    accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('media-upload')?.click()}
                    disabled={sendMutation.isPending}
                  >
                    📎
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMutation.isPending || !messageText.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-[540px] flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </Card>
    </div>
    </div>
  );
}
