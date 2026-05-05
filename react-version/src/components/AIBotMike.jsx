import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import mikeAvatar from '../assets/avatar.jpeg';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://zerodashbackend.onrender.com';

/**
 * AI Bot Mike Component
 * Interactive chat assistant for Zero Dash game
 * Uses 0G Compute via the Zero Dash backend (no API keys in the browser).
 */
export default function AIBotMike() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey! I'm Mike, your running buddy! 🏃‍♂️ Need tips on dodging obstacles, collecting coins, or beating high scores? Just ask!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ];
    setMessages(newMessages);

    const apiMsgs = newMessages.slice(-12).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const wallet = typeof localStorage !== 'undefined'
        ? localStorage.getItem('walletAddress')
        : null;

      const headers = {
        'Content-Type': 'application/json',
      };
      if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        headers.Authorization = `Bearer ${wallet}`;
      }

      const response = await fetch(`${BACKEND_URL}/zerog/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: apiMsgs }),
      });

      const payload = await response.json().catch(() => null);
      const text =
        typeof payload?.choices?.[0]?.message?.content === 'string'
          ? payload.choices[0].message.content
          : null;

      if (!response.ok || !text) {
        const errHint =
          (payload && typeof payload.error === 'object' && payload.error.message) ||
          payload?.message ||
          payload?.detail ||
          'chat_error';
        throw new Error(String(errHint));
      }

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: text,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('AI Bot (0g) error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "Whoa, connection hiccup on the 0G line! 😅 Try again in a sec — or ask your squad if the game's chat backend is up.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] group"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-zerion-yellow to-orange-500 opacity-75 blur-lg group-hover:opacity-100 animate-pulse" />

          <div
            className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-zerion-yellow
                          bg-gradient-to-br from-zerion-blue to-zerion-blue-dark shadow-2xl
                          transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12
                          cursor-pointer"
          >
            <img src={mikeAvatar} alt="Mike" className="w-full h-full object-cover" />

            <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-lg shadow-green-500/50" />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1 px-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageCircle size={14} className="text-zerion-yellow" />
            </div>
          </div>

          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-red-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            ?
          </div>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[420px] max-h-[600px] 
                        bg-zerion-blue-dark border-4 border-zerion-yellow rounded-xl
                        shadow-2xl flex flex-col overflow-hidden
                        animate-slideUp"
          style={{
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)',
          }}
        >
          <div className="bg-gradient-to-r from-zerion-blue to-zerion-blue-dark border-b-4 border-zerion-yellow p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={mikeAvatar} alt="Mike" className="w-12 h-12 rounded-full border-3 border-zerion-yellow" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-lg font-pixel text-zerion-yellow font-bold">Mike 🏃‍♂️</h3>
                <p className="text-xs font-pixel text-zerion-blue-light">
                  Responses via{' '}
                  <span className="text-white/90 font-semibold">0G Compute</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zerion-light hover:text-zerion-yellow transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-zerion-blue/50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zerion-blue-medium/30 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <img
                    src={mikeAvatar}
                    alt="Mike"
                    className="w-8 h-8 rounded-full border-2 border-zerion-yellow flex-shrink-0"
                  />
                )}

                <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg font-pixel text-sm
                                ${
                                  msg.role === 'user'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                    : 'bg-zerion-blue border-2 border-zerion-yellow text-white'
                                }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs font-pixel text-zerion-blue-light mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <img src={mikeAvatar} alt="Mike" className="w-8 h-8 rounded-full border-2 border-zerion-yellow" />
                <div className="bg-zerion-blue border-2 border-zerion-yellow px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-zerion-yellow rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-zerion-yellow rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-zerion-yellow rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-zerion-blue border-t-4 border-zerion-yellow">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Mike anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-zerion-blue-medium border-2 border-zerion-blue text-white font-pixel text-sm rounded
                           focus:outline-none focus:border-zerion-yellow
                           disabled:opacity-50 disabled:cursor-not-allowed
                           placeholder:text-zerion-blue-light"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 bg-gradient-to-r from-zerion-yellow to-orange-500
                           text-white font-pixel text-sm rounded
                           hover:from-yellow-500 hover:to-orange-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2 min-w-[60px]"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs font-pixel text-zerion-blue-light mt-2 text-center">
              Mike runs tips through your Zero Dash backend&apos;s{' '}
              <span className="text-white/80">0G Compute</span> route — no keys in-browser.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f59e0b;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d97706;
        }
      `}</style>
    </>
  );
}
