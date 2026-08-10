"use client";

import { useState, useRef, useEffect } from 'react';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '600', '700'] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ['400', '600', '700'] });

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Atrium assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          // Our backend expects the messages array, filter out system if you had any local ones,
          // though our local state only has user/assistant
          messages: newMessages 
        }) 
      });

      if (!res.ok) {
        throw new Error('Failed to fetch from assistant API');
      }

      const data = await res.json();
      
      if (data.role) {
        setUserRole(data.role);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${spaceGrotesk.className}`}>
      {isOpen ? (
        <div className="w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col bg-[#FAF6EE] border-4 border-[#171717] shadow-[8px_8px_0_0_#171717] transition-all duration-300">
          {/* Header */}
          <div className="bg-[#FFC93C] border-b-4 border-[#171717] p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg uppercase tracking-wider text-[#171717]">AI Assistant</h2>
              {userRole && (
                <p className={`${plexMono.className} text-xs font-bold text-[#171717] uppercase`}>
                  Auth: {userRole}
                </p>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#171717] hover:text-[#2F4BFF] border-2 border-transparent hover:border-[#171717] p-1 transition-colors"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 border-2 border-[#171717] shadow-[2px_2px_0_0_#171717] ${
                    msg.role === 'user' 
                      ? 'bg-[#2F4BFF] text-white' 
                      : 'bg-[#FAF6EE] text-[#171717]'
                  }`}
                >
                  <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className={`${plexMono.className} text-[10px] uppercase font-bold text-[#171717] mt-1`}>
                  {msg.role}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] p-3 border-2 border-[#171717] shadow-[2px_2px_0_0_#171717] bg-[#FAF6EE] text-[#171717]">
                  <p className={`${plexMono.className} text-sm font-bold animate-pulse`}>typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-4 border-[#171717] p-3 bg-white">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about sessions..."
                className={`${plexMono.className} flex-1 border-2 border-[#171717] p-2 text-sm text-[#2F4BFF] font-bold bg-[#FAF6EE] placeholder-[#171717] focus:outline-none focus:bg-white transition-colors`}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#2F4BFF] text-white border-2 border-[#171717] px-4 py-2 shadow-[2px_2px_0_0_#171717] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#171717] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#FFC93C] text-[#171717] border-4 border-[#171717] p-4 shadow-[4px_4px_0_0_#171717] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#171717] transition-all flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="group-hover:scale-110 transition-transform">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
