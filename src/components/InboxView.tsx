import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  Check, 
  HelpCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle
} from "lucide-react";
import { Conversation, ChatMessage } from "../types";
import { suggestReplies } from "../lib/api";

interface InboxViewProps {
  conversations: Conversation[];
  onSendMessage: (convId: string, sender: 'lead' | 'user', text: string) => void;
}

export default function InboxView({ conversations, onSendMessage }: InboxViewProps) {
  
  // States
  const [activeConv, setActiveConv] = useState<Conversation | null>(conversations[0] || null);
  const [inputText, setInputText] = useState("");
  
  // AI Suggestions states
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ tone: string; text: string }[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);

  // Auto-sync active conversation changes
  useEffect(() => {
    if (activeConv) {
      const refreshedIdx = conversations.findIndex(c => c.id === activeConv.id);
      if (refreshedIdx !== -1) {
        setActiveConv(conversations[refreshedIdx]);
      }
    }
  }, [conversations]);

  const handleSend = () => {
    if (!activeConv || !inputText.trim()) return;
    const cleanText = inputText.trim();

    // Optimistic Update: Append newly typed message straight into local thread state
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toISOString()
    };

    setActiveConv(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage]
      };
    });

    onSendMessage(activeConv.id, 'user', cleanText);
    setInputText("");
    setAiSuggestions([]); // Reset suggestions
  };

  const triggerSuggestReplies = async () => {
    if (!activeConv) return;
    setLoadingSuggestions(true);
    setAiSuggestions([]);

    try {
      // Map message details structure for prompt payload
      const threadHistory = activeConv.messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await suggestReplies({
        thread: threadHistory,
        platform: activeConv.platform
      });

      setAiSuggestions(response.suggestions || []);
      setIsSimulated(!!response.sim);
    } catch (err) {
      console.error(err);
      alert("Suggestions Error: Undergoing maintenance or missing credentials.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in items-start h-[calc(100vh-170px)]">
      
      {/* 1. Left Sidebar: Active Conversations (1/3) */}
      <div className="md:col-span-1 bg-zinc-950 border border-zinc-805 rounded-2xl p-4 h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <h3 className="text-sm font-display font-semibold text-white">Conversation Hub</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {conversations.length} Active Segment{conversations.length !== 1 && "s"}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-270px)]">
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-8">Inbox is empty</p>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                const lastMsg = c.messages[c.messages.length - 1];
                
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveConv(c);
                      setAiSuggestions([]); // Reset
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? "bg-zinc-805 border-zinc-700 shadow-sm" 
                        : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="relative flex-shrink-0">
                        <img
                          src={c.leadAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                          alt={c.leadName}
                          className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          c.platform === 'linkedin' ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {c.platform === 'linkedin' ? 'L' : 'I'}
                        </span>
                      </div>
                      
                      <div className="text-left overflow-hidden">
                        <h4 className="text-xs font-bold text-white font-sans max-w-[150px] truncate leading-tight">{c.leadName}</h4>
                        <p className="text-[10px] font-sans text-zinc-400 truncate max-w-[150px] mt-0.5">
                          {lastMsg ? lastMsg.text : "No messages recorded"}
                        </p>
                      </div>
                    </div>

                    {c.unread && (
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-soft-pulse flex-shrink-0"></span>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Center/Right: Message Feed & AI reply Assistant (2/3) */}
      <div className="md:col-span-2 h-full flex flex-col gap-4">
        {activeConv ? (
          <>
            {/* Feed Main Card */}
            <div className="flex-1 bg-zinc-950 border border-zinc-805 rounded-2xl p-4 flex flex-col justify-between h-[calc(100vh-270px)]">
              
              {/* Profile Bar top */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeConv.leadAvatar}
                    alt={activeConv.leadName}
                    className="w-9 h-9 rounded-lg object-cover border border-zinc-800"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-white font-sans">{activeConv.leadName}</h3>
                    <p className="text-[10px] font-sans text-zinc-500">
                      Channel: <span className="uppercase text-zinc-300 font-mono font-semibold">{activeConv.platform}</span> DM handle: @{activeConv.leadHandle}
                    </p>
                  </div>
                </div>

                {/* AI recommendation trigger button */}
                <button
                  type="button"
                  onClick={triggerSuggestReplies}
                  disabled={loadingSuggestions}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 rounded-xl transition-all border border-zinc-300 flex items-center space-x-1 shadow-sm"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading context...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-soft-pulse" />
                      <span>Generate AI Answers</span>
                    </>
                  )}
                </button>
              </div>

              {/* Message Streams list */}
              <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1.5 scroll-smooth">
                {activeConv.messages.map((m: any) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs font-medium leading-relaxed font-sans ${
                        isUser 
                          ? 'bg-zinc-800 text-white border border-zinc-700 rounded-tr-none' 
                          : 'bg-zinc-900/60 text-zinc-200 border border-zinc-850 rounded-tl-none'
                      }`}>
                        <p>{m.text}</p>
                        
                        {/* Status tracking & Sentiment badge */}
                        <div className="flex items-center justify-end mt-1.5 pt-1 border-t border-zinc-900/40 text-[9px] font-mono text-zinc-500 tracking-wider space-x-2.5">
                          {!isUser && m.sentiment && (
                            <span className={`px-1 rounded text-[7px] font-bold ${
                              m.sentiment === 'POSITIVE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' :
                              m.sentiment === 'NEGATIVE' ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30' :
                              'bg-zinc-900 text-zinc-400 border border-zinc-805'
                            }`}>
                              {m.sentiment}
                            </span>
                          )}
                          <span>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isUser && (
                            <span className={`flex items-center text-[7px] font-bold ${
                              m.status === 'READ' ? 'text-zinc-300' : 'text-zinc-500'
                            }`}>
                              {m.status === 'READ' ? (
                                <span className="flex items-center">✓✓ <span className="ml-0.5 tracking-normal">READ</span></span>
                              ) : m.status === 'DELIVERED' ? (
                                <span className="flex items-center">✓✓ <span className="ml-0.5 tracking-normal">DELIVERED</span></span>
                              ) : (
                                <span className="flex items-center">✓ <span className="ml-0.5 tracking-normal">SENT</span></span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Text Writing Input Dock */}
              <div className="border-t border-zinc-900 pt-3 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Type draft reply manually or click on active AI Suggestions below..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-355 text-xs rounded-xl px-4 py-3 text-white outline-none font-sans"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-3 bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 rounded-xl transition-all flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Bottom Slider Box for suggested smart replies */}
            {aiSuggestions.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono text-zinc-100 uppercase tracking-widest flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    Bespoke Response Recommendations
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {isSimulated ? "Simulated Backup" : "Live Gemini 3.5 Session"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(s.text);
                      }}
                      className="text-left p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all space-y-1.5 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
                    >
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-850 font-bold">
                        {s.tone}
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-snug truncate-3-lines italic">
                        "{s.text}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-600 flex flex-col justify-center items-center h-full">
            <MessageSquare className="w-12 h-12 text-zinc-800 mb-3" />
            <p className="text-sm font-sans">No Conversation Thread Selected</p>
            <p className="text-xs text-zinc-500 mt-1">Pick a prospect from the inbox feed list to parse dialogue records and suggest swift replies.</p>
          </div>
        )}
      </div>

    </div>
  );
}
