import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'admin';
  senderId: string;
  conversationId: string;
  createdAt: Date | string;
}

interface LiveChatProps {
  isAdmin?: boolean;
  conversationId?: string;
}

export default function LiveChat({ isAdmin = false, conversationId }: LiveChatProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const handleAuthError = (status: number) => {
    if (status === 401 || status === 403) {
      logout();
      setLocation("/login");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get or create conversation
  const { data: conversation } = useQuery({
    queryKey: ['/api/conversations/user-conversation'],
    enabled: !!user?.id && !conversationId,
  });

  // Use provided conversation ID or the user's conversation
  const chatConversationId = conversationId || (conversation as any)?.id || "";

  // Get messages with polling
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/messages', chatConversationId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${chatConversationId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        handleAuthError(response.status);
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!chatConversationId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          conversationId: chatConversationId,
        })
      });
      if (!response.ok) {
        handleAuthError(response.status);
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatConversationId] });
      setNewMessage("");
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ((conversation as any)?.id) {
      setCurrentConversationId((conversation as any).id);
    }
  }, [conversation]);

  const sendMessage = () => {
    if (!newMessage.trim() || sendMessageMutation.isPending || !chatConversationId) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Please log in to use live chat support
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-sm">
            {isAdmin ? "Admin Support Chat" : "Live Support"}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Ready
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${
                  (isAdmin && message.senderType !== 'admin') || (!isAdmin && message.senderType === 'admin') 
                    ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                    (isAdmin && message.senderType !== 'admin') || (!isAdmin && message.senderType === 'admin')
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={!chatConversationId || sendMessageMutation.isPending}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !chatConversationId || sendMessageMutation.isPending}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {sendMessageMutation.isError && (
          <p className="text-xs text-red-500 mt-2">
            Failed to send message. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}