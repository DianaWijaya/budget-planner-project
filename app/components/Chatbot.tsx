import { useState, useRef, useEffect } from 'react';
import { useFetcher } from 'react-router';
import * as Icons from 'lucide-react';
import { theme, cn } from '~/lib/theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your budget assistant powered by Google Gemini. Ask me anything about your spending, budget, or get financial tips!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (fetcher.data?.response) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: fetcher.data.response,
          timestamp: new Date(),
        },
      ]);
    }
    
    if (fetcher.data?.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ ${fetcher.data.error}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [fetcher.data]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    const formData = new FormData();
    formData.append('message', input);
    fetcher.submit(formData, {
      method: 'post',
      action: '/api/chat',
    });
    
    setInput('');
  };
  
  const quickActions = [
    "📊 Show my spending summary",
    "💰 Am I over budget?",
    "💡 Give me saving tips",
    "📈 Analyze my expenses",
  ];
  
  const handleQuickAction = (action: string) => {
    setInput(action);
  };
  
  return (
    <>
      {/* Floating Chat Button - Only show when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-50 flex items-center justify-center group animate-bounce hover:animate-none"
          aria-label="Open chat assistant"
        >
          <Icons.MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}
      
      {/* Chat Popup Window - Only show when open */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Window */}
          <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icons.Bot className="h-6 w-6" />
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Your Personal Budget Assistant</h3>
                  <p className="text-xs text-blue-100">Gemini AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                aria-label="Close chat"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex animate-slideIn',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl p-3 shadow-sm',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    <p className={cn(
                      "text-xs mt-1.5",
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    )}>
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Loading Animation */}
              {fetcher.state === 'submitting' && (
                <div className="flex justify-start animate-slideIn">
                  <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm border border-gray-200">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions - Show only on first message */}
              {messages.length === 1 && fetcher.state === 'idle' && (
                <div className="space-y-2 animate-slideIn">
                  <p className="text-xs text-gray-500 text-center font-medium">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action)}
                        className="text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-left transition-all shadow-sm hover:shadow hover:scale-105"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about your budget..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={fetcher.state === 'submitting'}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || fetcher.state === 'submitting'}
                  className={cn(
                    "rounded-lg px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                    "text-white font-medium shadow-sm hover:shadow"
                  )}
                  aria-label="Send message"
                >
                  <Icons.Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Powered by Google Gemini AI
              </p>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}