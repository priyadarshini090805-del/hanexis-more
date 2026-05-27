import React, { useState } from "react";
import { 
  Sparkles, 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  FileText, 
  Instagram, 
  Linkedin, 
  Video, 
  Copy, 
  Check, 
  CheckCircle,
  Clock
} from "lucide-react";
import { ScheduledPost } from "../types";
import { generateAIContent } from "../lib/api";

interface ContentPlannerViewProps {
  posts: ScheduledPost[];
  onAddPost: (post: Partial<ScheduledPost>) => void;
  onUpdatePostStatus: (id: string, updates: Partial<ScheduledPost>) => void;
}

export default function ContentPlannerView({ posts, onAddPost, onUpdatePostStatus }: ContentPlannerViewProps) {
  
  // AI strategist generator state
  const [topic, setTopic] = useState("Modern B2B Leads Strategy");
  const [platform, setPlatform] = useState<'linkedin' | 'instagram'>('linkedin');
  const [format, setFormat] = useState<'Regular Post' | 'Video Script' | 'Job Post'>('Regular Post');
  const [audience, setAudience] = useState("SaaS Founders & VPs");
  const [keyPoints, setKeyPoints] = useState("Research outreach targets thoroughly, provide values first, never send cold spam.");
  
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scheduling overlay details
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedDate, setSchedDate] = useState("2026-05-28");
  const [schedStatus, setSchedStatus] = useState<'draft' | 'scheduled'>('scheduled');

  const handleGenerateContent = async () => {
    if (!topic) {
      alert("Please input a key topic strategy.");
      return;
    }
    setLoading(true);
    setGeneratedText("");

    try {
      const result = await generateAIContent({
        topic,
        platform,
        format,
        audience,
        keyPoints
      });
      setGeneratedText(result.text);
      setIsSimulated(!!result.sim);
      setSchedTitle(`AI: ${topic}`);
    } catch (err: any) {
      console.error(err);
      setGeneratedText(`Strategist Error: Could not compute content matrix. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseVisualTheme = (text: string) => {
    const match = text.match(/\[Visual Theme:\s*([^\]]+)\]/i);
    return match ? match[1] : null;
  };

  const triggerPostCreate = () => {
    if (!generatedText) return;
    onAddPost({
      title: schedTitle || topic,
      content: generatedText,
      platform,
      publishDate: schedDate,
      status: schedStatus,
      visualPrompt: parseVisualTheme(generatedText) || "Sleek geometric structures with ambient silver spotlight lighting"
    });
    setShowScheduleModal(false);
    alert("Post added to the Content Calendar roadmap!");
  };

  // Build high-polished Calendar rendering for MAY 2026
  // May 1st 2026 is Friday, let's align grid cells
  // We specify month name: May 2026
  const monthName = "May 2026";
  const startOffsetDays = 5; // Friday is offset 5 in [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
  const totalDaysInMonth = 31;
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, index) => index + 1);

  // Map scheduled posts specifically onto calendar days (May dates YYYY-MM-DD)
  const getPostsForDay = (dayNum: number) => {
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const targetDateStr = `2026-05-${dayStr}`;
    return posts.filter(p => p.publishDate === targetDateStr);
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm text-zinc-300 font-sans">
      
      {/* Page header */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-zinc-200" />
          Campaign Content Planner
        </h2>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">
          Generate platform-adapted copywriting, outline visual assets direction, and map campaigns onto an interactive editorial calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Section: AI Content strategizer form (2/5) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-5 rounded-sm space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-200" />
            AI Content Strategist
          </h3>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Target Platform</label>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setPlatform("linkedin")}
                className={`py-2 rounded-sm text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                  platform === "linkedin"
                    ? "bg-zinc-900 border border-zinc-700 text-white font-bold"
                    : "bg-zinc-905 border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn Workspace</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPlatform("instagram")}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                  platform === "instagram"
                    ? "bg-zinc-900 border border-zinc-700 text-white font-bold"
                    : "bg-zinc-900 border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram Feed</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Content Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-850 text-xs rounded-lg p-2.5 text-zinc-300 outline-none"
              >
                <option value="Regular Post">Regular Post (Hooks/Body)</option>
                <option value="Video Script">Video/Reels Script</option>
                <option value="Job Post">B2B Job Post</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="E.g. Developers / Small agency"
                className="w-full bg-zinc-900 border border-zinc-850 text-xs rounded-lg p-2.5 text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 font-medium">Topic Theme Hook*</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What to write about..."
              className="w-full bg-zinc-900 border border-zinc-850 text-xs rounded-lg p-2.5 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Points / Context to hit</label>
            <textarea
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="Enter details, features, stats or references to enrich post authority..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-850 text-xs rounded-lg p-2.5 text-white outline-none resize-none font-sans"
            />
          </div>

          <button
            onClick={handleGenerateContent}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-zinc-250 disabled:bg-zinc-700 text-zinc-950 font-bold rounded-sm transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center space-x-1 border border-zinc-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Content Matrix calculations...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Calculate & Draft with AI</span>
              </>
            )}
          </button>

          {/* Prompt output display card if generated */}
          {generatedText && (
            <div className="mt-4 p-4.5 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">Generated Campaign Copy</span>
                <span className="text-[9px] text-zinc-500 font-mono">Platform optimized</span>
              </div>
              
              <div className="max-h-72 overflow-y-auto text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 whitespace-pre-wrap font-sans">
                {generatedText}
              </div>

              {/* Visual guidance section if present */}
              {parseVisualTheme(generatedText) && (
                <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 flex items-center space-x-1">
                    <span>🖼️ Suggested Artwork Prompt</span>
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {parseVisualTheme(generatedText)}
                  </p>
                </div>
              )}

              {/* Scheduling triggers */}
              <div className="flex gap-2 pt-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-sm flex items-center justify-center space-x-1 uppercase"
                >
                  {copied ? (
                    <span className="text-green-400">Copied!</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="flex-1 py-2 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-sm flex items-center justify-center space-x-1 uppercase"
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  <span>Program Calendar</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Section: Visual programming calendar (3/5) */}
        <div className="lg:col-span-3 bg-zinc-950 border border-zinc-900 p-6 rounded-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-1.5">
                Campaign Programming Grid
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Track multi-channel publishing calendars in high-resolution schedule views.</p>
            </div>
            
            <div className="flex items-center space-x-2 bg-zinc-900 p-1.5 rounded-sm border border-zinc-805">
              <ChevronLeft className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-white" />
              <span className="text-xs font-mono font-bold text-zinc-200">{monthName}</span>
              <ChevronRight className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Calendar Day headers [Sun, Mon, Tue...] */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono uppercase text-zinc-500 font-bold border-b border-zinc-900 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5">
            {/* Render offset blank spaces */}
            {Array.from({ length: startOffsetDays }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-20 bg-zinc-900/10 border border-zinc-900/40 rounded-sm opacity-30"></div>
            ))}

            {/* Render actual day numbers */}
            {daysArray.map((day) => {
              const dayPosts = getPostsForDay(day);
              const isToday = day === 27; // May 27, 2026 is today's local metadata date.
              
              return (
                <div 
                  key={day} 
                  className={`h-22 p-2 rounded-sm border flex flex-col justify-between overflow-hidden transition-all text-left ${
                    isToday 
                      ? "bg-zinc-900 border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                      : "bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/50 hover:border-zinc-850"
                  }`}
                >
                  <span className={`text-[10px] font-mono font-semibold ${isToday ? "text-white font-bold" : "text-zinc-500"}`}>
                    {day} {isToday && "• Today"}
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 pointer-events-auto">
                    {dayPosts.map((post) => (
                      <div 
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Post: ${post.title}\nPublish Date: ${post.publishDate}\nPlatform: ${post.platform.toUpperCase()}\nStatus: ${post.status.toUpperCase()}`);
                        }}
                        className={`text-[9px] truncate p-1 rounded font-sans leading-tight cursor-help border transition-colors ${
                          post.platform === 'linkedin' 
                            ? "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800" 
                            : "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
                        }`}
                        title={post.title}
                      >
                        {post.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-500">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800 mr-2 inline-block"></span>
              LinkedIn Post
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700 mr-2 inline-block"></span>
              Instagram Post
            </span>
            <span className="flex items-center text-zinc-300 ml-auto">
              <Clock className="w-4 h-4 mr-1 animate-soft-pulse" />
              <span>Today is UTC May 27, 2026</span>
            </span>
          </div>

        </div>

      </div>

      {/* Program Overlay modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in relative">
            <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-zinc-200" />
              Program Content Schedule
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Interactive Topic Label</label>
                <input
                  type="text"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  placeholder="E.g. SaaS Pipeline Optimization"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-xs rounded-lg p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Target Launch Date (May 2026)</label>
                <input
                  type="date"
                  min="2026-05-01"
                  max="2026-05-31"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-xs rounded-lg p-2.5 text-zinc-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Initial Status</label>
                <select
                  value={schedStatus}
                  onChange={(e) => setSchedStatus(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-xs rounded-lg p-2.5 text-zinc-300 outline-none"
                >
                  <option value="scheduled">Scheduled & Approved</option>
                  <option value="draft">Save to Drafts</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-850 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerPostCreate}
                className="px-4 py-1.5 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Log Post Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
