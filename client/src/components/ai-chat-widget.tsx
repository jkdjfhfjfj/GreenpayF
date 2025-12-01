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

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
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
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 border-0 p-0 bg-transparent overflow-hidden"
      >
        <img 
          src="https://res.cloudinary.com/dyzalgxnu/image/upload/v1764591649/greenpay/greenpay/ai-robot.jpg" 
          alt="Ask AI Assistant" 
          className="w-full h-full object-cover rounded-full hover:scale-110 transition-transform duration-200"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.backgroundColor = '#3b82f6';
          }}
        />
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
