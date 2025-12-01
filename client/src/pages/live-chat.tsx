import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageSquare, HeadphonesIcon, Paperclip, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { WavyHeader } from "@/components/wavy-header";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  adminId?: string;
  status: 'active' | 'closed';
  title?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LiveChatPage() {
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  // Get or create conversation for current user
  const { data: conversation, error: conversationError } = useQuery<Conversation>({
    queryKey: ['/api/conversations/user-conversation'],
    queryFn: async () => {
      const response = await fetch('/api/conversations/user-conversation', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
  });

  // Handle authentication errors - logout and redirect to login
  useEffect(() => {
    if (conversationError && (conversationError as any).message?.includes('401')) {
      // Clear session and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      logout();
      setLocation('/login');
    }
  }, [conversationError, logout, setLocation]);

  // Get messages with polling
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const response = await fetch(`/api/messages/${conversation.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!conversation?.id,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType?: string; fileUrl?: string; fileName?: string; fileSize?: number }) => {
      if (!conversation?.id) {
        throw new Error('No active conversation');
      }
      
      return apiRequest('POST', '/api/messages', {
        conversationId: conversation.id,
        content: data.content,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessageText("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      const messageType = data.mimeType.startsWith('image/') ? 'image' : 'file';
      const content = messageType === 'image' ? 'Sent an image' : `Sent a file: ${data.fileName}`;
      
      sendMessageMutation.mutate({
        content,
        messageType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ content: messageText.trim() });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      uploadFileMutation.mutate(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <WavyHeader
        title="Live Support"
        onBack={() => setLocation('/support')}
        size="sm"
      />

      {/* Messages Container */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground">
                    Send us a message and we'll get back to you as soon as possible.
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                      message.senderType === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.messageType === 'image' && message.fileUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://') 
                            ? message.fileUrl 
                            : message.fileUrl.startsWith('/') 
                              ? message.fileUrl 
                              : `/${message.fileUrl}`
                          } 
                          alt="Uploaded image" 
                          className="max-w-full h-auto rounded cursor-pointer"
                          onClick={() => {
                            const url = message.fileUrl!.startsWith('http://') || message.fileUrl!.startsWith('https://')
                              ? message.fileUrl
                              : message.fileUrl!.startsWith('/')
                                ? message.fileUrl
                                : `/${message.fileUrl}`;
                            window.open(url, '_blank');
                          }}
                        />
                      </div>
                    )}
                    {message.messageType === 'video' && message.fileUrl && (
                      <div className="mb-2">
                        <video 
                          controls
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '250px' }}
                        >
                          <source 
                            src={message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://') 
                              ? message.fileUrl 
                              : message.fileUrl.startsWith('/') 
                                ? message.fileUrl 
                                : `/${message.fileUrl}`
                            } 
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {message.messageType === 'file' && message.fileUrl && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded">
                        <Paperclip className="w-4 h-4" />
                        <a 
                          href={message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://')
                            ? message.fileUrl
                            : message.fileUrl.startsWith('/')
                              ? message.fileUrl
                              : `/${message.fileUrl}`
                          }
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm underline hover:no-underline"
                        >
                          {message.fileName || 'Download file'}
                        </a>
                      </div>
                    )}
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={!conversation?.id || sendMessageMutation.isPending || uploadFileMutation.isPending}
                className="flex-1"
                data-testid="input-message"
              />
              
              {/* File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!conversation?.id || uploadFileMutation.isPending}
                data-testid="button-upload"
                title="Upload file or image"
              >
                {uploadFileMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || !conversation?.id || sendMessageMutation.isPending || uploadFileMutation.isPending}
                data-testid="button-send"
              >
                {sendMessageMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-icons text-sm">send</span>
                )}
              </Button>
            </div>
            
            {sendMessageMutation.isError && (
              <p className="text-xs text-red-500 mt-2">
                Failed to send message. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}