import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  MessageSquare, 
  User, 
  Clock,
  CheckCircle,
  Circle,
  FileText,
  Image as ImageIcon,
  Paperclip
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readAt?: string;
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

export default function RealLiveChat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all active conversations (no polling - WebSocket will handle real-time updates)
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/admin/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/conversations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    refetchOnWindowFocus: false,
    // Removed refetchInterval - WebSocket will provide real-time updates
  });

  // Get messages for selected conversation (no polling - WebSocket will handle real-time updates)
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await fetch(`/api/messages/${selectedConversationId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedConversationId,
    refetchOnWindowFocus: false,
    // Removed refetchInterval - WebSocket will provide real-time updates
  });

  // WebSocket connection management for admin
  const connectWebSocket = useCallback(() => {
    // Create WebSocket connection 
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws`);
    
    ws.onopen = () => {
      console.log('Admin WebSocket connected');
      setIsConnected(true);
      
      // Register this connection as an admin
      ws.send(JSON.stringify({
        type: 'register',
        userId: 'admin', // TODO: Use actual admin ID when available
        isAdmin: true
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          // Update messages in selected conversation
          if (selectedConversationId) {
            queryClient.setQueryData(['/api/messages', selectedConversationId], (oldMessages: Message[] | undefined) => {
              if (!oldMessages) return [data.message];
              
              // Check if message already exists to avoid duplicates
              const messageExists = oldMessages.some(msg => msg.id === data.message.id);
              if (messageExists) return oldMessages;
              
              return [...oldMessages, data.message];
            });
          }
          
          // Update conversation list to refresh last message time
          queryClient.invalidateQueries({ queryKey: ['/api/admin/conversations'] });
        } else if (data.type === 'new_conversation') {
          // Refresh conversation list when new conversations are created
          queryClient.invalidateQueries({ queryKey: ['/api/admin/conversations'] });
        }
      } catch (error) {
        console.error('Error parsing admin WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Admin WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [selectedConversationId, queryClient]);

  // WebSocket connection effect
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!selectedConversationId) {
        throw new Error('No conversation selected');
      }
      
      return apiRequest('POST', '/api/messages', {
        conversationId: selectedConversationId,
        content: data.content,
        messageType: 'text'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/conversations'] });
      setMessageText("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Take conversation mutation
  const takeConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest('PUT', `/api/admin/conversations/${conversationId}/assign`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/conversations'] });
      toast({
        title: "Conversation assigned",
        description: "You are now handling this conversation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate({ content: messageText.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTakeConversation = (conversationId: string) => {
    takeConversationMutation.mutate(conversationId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderType === 'user') {
      return message.readAt ? (
        <CheckCircle className="w-3 h-3 text-green-500" />
      ) : (
        <Circle className="w-3 h-3 text-gray-400" />
      );
    }
    return null;
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-border">
        <Card className="h-full rounded-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Active Conversations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p data-testid="text-no-conversations">No active conversations</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                      selectedConversationId === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {conversation.title || 'User Support Request'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={conversation.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {conversation.status}
                        </Badge>
                        {!conversation.adminId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTakeConversation(conversation.id);
                            }}
                            disabled={takeConversationMutation.isPending}
                            data-testid={`button-take-${conversation.id}`}
                          >
                            Take
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {conversation.lastMessageAt 
                          ? format(new Date(conversation.lastMessageAt), 'MMM d, HH:mm')
                          : format(new Date(conversation.createdAt), 'MMM d, HH:mm')
                        }
                      </span>
                      {conversation.adminId && (
                        <span className="text-green-600">Assigned</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation?.title || 'User Support Chat'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Started {format(new Date(selectedConversation?.createdAt || ''), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Badge variant={selectedConversation?.status === 'active' ? 'default' : 'secondary'}>
                  {selectedConversation?.status}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === 'admin' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.senderType === 'user' && (
                          <div className="flex items-center mb-1">
                            <User className="w-3 h-3 mr-1" />
                            <span className="text-xs font-medium">User</span>
                          </div>
                        )}
                        
                        {message.messageType === 'file' || message.messageType === 'image' ? (
                          <div className="space-y-2">
                            {message.messageType === 'image' && message.fileUrl ? (
                              <img 
                                src={message.fileUrl} 
                                alt={message.fileName}
                                className="max-w-full rounded border"
                                data-testid={`image-${message.id}`}
                              />
                            ) : (
                              <div className="flex items-center space-x-2 p-2 bg-background/10 rounded">
                                {message.messageType === 'image' ? (
                                  <ImageIcon className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  {message.fileSize && (
                                    <p className="text-xs opacity-75">{formatFileSize(message.fileSize)}</p>
                                  )}
                                </div>
                              </div>
                            )}
                            {message.content !== message.fileName && (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-75">
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </span>
                          {getMessageStatus(message)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type your response..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                  data-testid="input-admin-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-admin-message"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start chatting with users
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}