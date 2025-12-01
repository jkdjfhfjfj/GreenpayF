import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  response?: string;
  error?: string;
  remainingRequests?: number;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load remaining requests when chat opens or component mounts
  useEffect(() => {
    const loadRemainingRequests = async () => {
      try {
        const response = await fetch('/api/ai/remaining-requests');
        if (response.ok) {
          const data = await response.json();
          setRemainingRequests(data.remainingRequests);
        }
      } catch (error) {
        console.log('Could not load remaining requests');
      }
    };

    if (isOpen) {
      loadRemainingRequests();
    }
  }, [isOpen]);


  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/ai/chat', {
        messages: messages.concat(userMessage).map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      const data: ChatResponse = await response.json();

      // Update remaining requests if provided
      if (data.remainingRequests !== undefined) {
        setRemainingRequests(data.remainingRequests);
      }

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (response.status === 429) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Rate limit reached. Please try again later.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Unable to process your request. Please try again later.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - AI Chat */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 border-0 p-0 bg-white overflow-hidden flex items-center justify-center"
      >
        <svg 
          className="w-8 h-8 hover:scale-110 transition-transform duration-200" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ color: '#25d366' }}
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.533.918-2.727 2.212-3.535 3.758-1.16 2.251-.893 4.797.608 6.942 1.25 1.8 3.124 2.974 5.19 3.19-1.003-1.35-1.622-3.01-1.622-4.827 0-2.635 1.075-5.022 2.83-6.78 1.755-1.758 4.14-2.84 6.774-2.84.55 0 1.095.044 1.633.126-1.505-1.757-3.61-2.747-5.843-2.747"/>
        </svg>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 w-80 h-80 sm:w-96 sm:h-96 max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Ask AI</h3>
                <p className="text-xs sm:text-sm text-emerald-100">Get help with GreenPay</p>
                {remainingRequests !== null && (
                  <p className="text-xs text-emerald-50 mt-1">
                    {remainingRequests} request{remainingRequests !== 1 ? 's' : ''} remaining today
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 ml-2 p-1 hover:bg-green-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-6 sm:mt-8">
                  <p className="text-xs sm:text-sm">👋 Hello! How can I help you today?</p>
                  <p className="text-xs mt-2 text-gray-400">Ask about payments, transfers, cards, or any feature</p>
                </div>
              )}
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-green-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-2 sm:p-3 flex flex-col gap-2 rounded-b-2xl bg-gray-50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="text-xs sm:text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm flex-shrink-0"
                >
                  Send
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">Powered by Gemini</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
