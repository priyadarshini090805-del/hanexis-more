import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  HelpCircle, 
  Loader2, 
  ChevronRight, 
  Flame, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { Lead } from "../types";
import { generateAIMessage } from "../lib/api";

interface AIComposerViewProps {
  leads: Lead[];
  initialSelectedLead: Lead | null;
  onLogActivity: (activity: any) => void;
  onViewChange: (view: any) => void;
}

export default function AIComposerView({ leads, initialSelectedLead, onLogActivity, onViewChange }: AIComposerViewProps) {
  
  // States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(initialSelectedLead || leads[0] || null);
  const [outreachType, setOutreachType] = useState<'connection' | 'follow_up' | 'sales_pitch'>('connection');
  const [tone, setTone] = useState("Professional & Insightful");
  const [customInstructions, setCustomInstructions] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(false);

  // Auto update selected lead if initial changes
  useEffect(() => {
    if (initialSelectedLead) {
      setSelectedLead(initialSelectedLead);
    }
  }, [initialSelectedLead]);

  const tonesList = [
    "Professional & Insightful",
    "Direct & Value-First",
    "Warm & Relatable",
    "Witty & Creative",
    "Strategic & Advisory"
  ];

  const handleGenerate = async () => {
    if (!selectedLead) {
      alert("Please select a target lead first.");
      return;
    }
    
    setLoading(true);
    setAiResult("");
    setIsSimulated(false);
    setApproved(false);

    try {
      const response = await generateAIMessage({
        name: selectedLead.name,
        title: selectedLead.title,
        company: selectedLead.company,
        bio: selectedLead.bio,
        notes: selectedLead.notes,
        platform: selectedLead.platform,
        type: outreachType,
        tone: tone,
        instructions: customInstructions
      });

      setAiResult(response.text);
      setIsSimulated(!!response.sim);
    } catch (err: any) {
      console.error(err);
      setAiResult(`Engine Alert: Could not initialize generation run. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveDraft = () => {
    if (!selectedLead || !aiResult) return;
    
    onLogActivity({
      leadId: selectedLead.id,
      leadName: selectedLead.name,
      type: outreachType,
      content: aiResult,
      status: "pending_approval"
    });

    setApproved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm leading-relaxed font-sans">
      
      {/* View Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-zinc-200" />
          COGNITIVE COMPOSER ENGINE
        </h2>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wide">
          Bespoke high-conversion messaging compiled dynamically via Gemini 3.5 Cog-Services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Form: Parameter Controls (3/5 width) */}
        <div className="lg:col-span-3 space-y-5 bg-zinc-950 border border-zinc-900 p-6 rounded-sm">
          
          <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3">Outreach Blueprint Parameter Settings</h3>
          
          {/* Pick Lead Dropdown */}
          <div className="space-y-1.5 font-mono">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider">Select Target Prospect Profile</label>
            <select
              value={selectedLead?.id || ""}
              onChange={(e) => {
                const lead = leads.find(l => l.id === e.target.value);
                if (lead) {
                  setSelectedLead(lead);
                  setApproved(false);
                  setAiResult("");
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-300 rounded-sm px-4 py-3 text-zinc-200 text-xs outline-none uppercase font-mono"
            >
              <option value="" disabled>-- Choose a Lead from Hub --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.title} @ {l.company}) - {l.platform.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {selectedLead && (
            <div className="bg-zinc-900 p-3.5 rounded-sm border border-zinc-800 space-y-1 font-mono">
              <p className="text-[10px] text-zinc-505 uppercase">Target context parsed:</p>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                <strong className="text-zinc-100">{selectedLead.name}</strong>, {selectedLead.title} at <strong className="text-zinc-100">{selectedLead.company}</strong>. 
                Platform: <span className="text-zinc-400 uppercase font-mono text-[10px] font-bold">[{selectedLead.platform}]</span>
              </p>
              {selectedLead.bio && (
                <p className="text-[10px] text-zinc-500 italic truncate mt-1">"{selectedLead.bio}"</p>
              )}
            </div>
          )}

          {/* Quick Outreach selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div>
              <label className="block text-[10px] text-zinc-550 uppercase tracking-wider mb-1.5">Outreach Type</label>
              <select
                value={outreachType}
                onChange={(e) => setOutreachType(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-zinc-300 outline-none uppercase font-mono"
              >
                <option value="connection">Connection Invites</option>
                <option value="follow_up">Smart Follow-up</option>
                <option value="sales_pitch">Value Sales Pitch</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-550 uppercase tracking-wider mb-1.5">Acoustic Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-zinc-300 outline-none uppercase font-mono"
              >
                {tonesList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-550 uppercase tracking-wider mb-1.5">Max Word count</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-zinc-500">
                <span>&lt; 100 Words (Standard)</span>
              </div>
            </div>
          </div>

          {/* Custom instruction string area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <label className="block text-zinc-550 uppercase tracking-wider">Bespoke Instructions (Optional)</label>
              <span className="text-zinc-500 uppercase">Constraints</span>
            </div>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="E.g. Mention our mutual connection or interest, align pitch with our B2B analytics dashboards..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-805 text-xs rounded-sm p-3 text-white outline-none resize-none placeholder-zinc-650 font-mono"
            />
          </div>

          {/* Launch Trigger */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-45 text-zinc-950 font-bold font-mono rounded-sm transition-all uppercase tracking-wider text-xs flex items-center justify-center space-x-2 border border-zinc-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>[ COMPILED COPY: RUNNING... ]</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>[ COMPILE COGNITIVE INSTANCE ]</span>
              </>
            )}
          </button>

        </div>

        {/* Right Form: Realtime Output Monitor (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 font-mono text-xs">
              <h3 className="uppercase font-bold text-white flex items-center gap-1.5">
                Output Monitor
              </h3>
              <span className="text-[10px] text-zinc-450 flex items-center bg-zinc-900 px-2.5 py-1 rounded-sm border border-zinc-800">
                PORT: <strong className="text-zinc-400 ml-1 uppercase">[{selectedLead?.platform || "linkedin"}]</strong>
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-500 font-mono">
                <div className="relative mb-4">
                  <div className="w-10 h-10 rounded-sm border-t-2 border-r-2 border-zinc-300 animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-zinc-200 absolute top-3 left-3 animate-pulse" />
                </div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">[ COG_SYNTHESIZER_RUNNING ]</p>
                <p className="text-[9px] text-zinc-500 mt-2 max-w-[200px] text-center uppercase">CONSTRUCTING OUTBOUND TELEMETRY COPY INSTANCE...</p>
              </div>
            ) : aiResult ? (
              <div className="space-y-4 font-mono">
                {/* Visual result container */}
                <div className="relative">
                  <div className="relative bg-zinc-905 border border-zinc-805 rounded-sm p-4 space-y-3">
                    <p className="text-xs font-sans text-zinc-200 leading-relaxed italic font-medium">
                      "{aiResult}"
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-zinc-900 pt-2 text-zinc-500 uppercase tracking-wider">
                      <span>TONE: <strong className="text-zinc-400">{tone}</strong></span>
                      <span>WORDS: {aiResult.split(/\s+/).length}</span>
                    </div>
                  </div>
                </div>

                {/* Integration Status Badge */}
                {isSimulated ? (
                  <div className="flex items-center space-x-2 text-[10px] bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 rounded-sm text-zinc-400">
                    <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="leading-snug">
                      ACTIVE: <strong className="text-zinc-300 font-semibold uppercase">SIMULATOR_RUN</strong>. Add your <strong className="text-zinc-300 font-mono">GEMINI_API_KEY</strong> secret to run complete live cognitive instances.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[10px] bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 rounded-sm text-zinc-300 font-mono uppercase">
                     <CheckCircle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                     <span className="leading-snug">
                       ACTIVE: <strong className="text-zinc-300 font-semibold">[ COGNITIVE_GEMINI_LIVE_RUN ]</strong> HANDLED SECURELY ON SERVER BACKEND NODE.
                     </span>
                  </div>
                )}

                {/* Actions hub */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 px-4 py-2.5 text-[10px] font-mono font-bold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 rounded-sm transition-all flex items-center justify-center space-x-1.5 uppercase"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Clipboard</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleApproveDraft}
                    disabled={approved}
                    className="flex-2 px-4 py-2.5 text-[10px] font-mono font-bold bg-white hover:bg-zinc-200 text-zinc-950 rounded-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 uppercase"
                  >
                    {approved ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-zinc-950" />
                        <span className="text-zinc-600">[ MOVED_TO_QUEUE ]</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>APPROVE & QUEUE()</span>
                      </>
                    )}
                  </button>
                </div>

                {approved && (
                  <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-sm text-center">
                    <p className="text-[10px] text-zinc-200 uppercase">
                      Successfully appended to campaign pipeline queue! Validate layout in the <button onClick={() => onViewChange("dashboard")} className="font-bold underline text-white">System Console Dashboard</button>.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-zinc-600 font-mono">
                <HelpCircle className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs uppercase font-bold text-zinc-450 tracking-wider">No synthesis launched</p>
                <p className="text-[10px] text-zinc-550 mt-1 max-w-[200px] mx-auto uppercase leading-normal">Configure outbound parameters & run compiler to trigger AI copy drafting.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
