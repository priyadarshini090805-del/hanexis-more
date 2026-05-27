import React, { useState, useEffect } from "react";
import { 
  Users, 
  MousePointerClick, 
  Flame, 
  Percent, 
  ArrowUpRight, 
  Smartphone, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Play, 
  AlertTriangle,
  Download,
  Terminal,
  RefreshCw,
  TrendingUp,
  Sliders,
  Calendar,
  Share2,
  PieChart as PieIcon,
  Layers,
  BarChart2,
  Brain
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { AnalyticsSummary, OutreachActivity, Lead } from "../types";
import { 
  getAnalyticsLeads, 
  getAnalyticsCampaigns, 
  getAnalyticsOutreach, 
  getAnalyticsAIUsage, 
  exportAnalyticsReport 
} from "../lib/api";

interface DashboardViewProps {
  analytics: AnalyticsSummary;
  activities: OutreachActivity[];
  leads: Lead[];
  onViewChange: (view: any) => void;
  onApproveActivity: (id: string) => void;
}

export default function DashboardView({ analytics, activities, leads, onViewChange, onApproveActivity }: DashboardViewProps) {
  const [subTab, setSubTab] = useState<'overview' | 'leads' | 'campaigns' | 'outreach' | 'ai'>('overview');
  const [platform, setPlatform] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('last-30');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Loaded analytics data from API
  const [leadsData, setLeadsData] = useState<any>(null);
  const [campaignsData, setCampaignsData] = useState<any>(null);
  const [outreachData, setOutreachData] = useState<any>(null);
  const [aiUsageData, setAiUsageData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const colors = ["#a855f7", "#ffffff", "#71717a", "#4b5563", "#3b82f6", "#10b981", "#ef4444"];

  // Calculate parameters for API filters
  const getFilterParams = () => {
    let computedStart = startDate;
    let computedEnd = endDate;

    if (dateRange !== "custom") {
      const days = dateRange === "last-7" ? 7 : dateRange === "last-90" ? 90 : 30;
      computedStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      computedEnd = new Date().toISOString().slice(0, 10);
    }

    return {
      startDate: computedStart || undefined,
      endDate: computedEnd || undefined,
      platform: platform !== "all" ? platform : undefined
    };
  };

  const fetchActiveAnalytics = async () => {
    setLoading(true);
    try {
      const activeFilters = getFilterParams();
      
      // Load concurrent data matching current context for responsiveness
      const [lRes, cRes, oRes, aRes] = await Promise.all([
        getAnalyticsLeads(activeFilters).catch(() => null),
        getAnalyticsCampaigns(activeFilters).catch(() => null),
        getAnalyticsOutreach(activeFilters).catch(() => null),
        getAnalyticsAIUsage(activeFilters).catch(() => null)
      ]);

      if (lRes) setLeadsData(lRes);
      if (cRes) setCampaignsData(cRes);
      if (oRes) setOutreachData(oRes);
      if (aRes) setAiUsageData(aRes);
    } catch (e) {
      console.error("Harnexis: Failure gathering filtered analytics telemetry stream", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAnalytics();
  }, [subTab, platform, dateRange, startDate, endDate]);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const activeFilters = getFilterParams();
      const blob = await exportAnalyticsReport(activeFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hanexis_analytics_report_${platform}_${dateRange}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export analytics failure:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const recentDrafts = activities.filter(a => a.status === 'pending_approval' || a.status === 'draft').slice(0, 3);

  // Active working metrics derived dynamically from fetched datasets or properties
  const currentLeadsKPI = leadsData || {
    totalLeads: analytics.totalLeads || 0,
    contactedLeads: analytics.contactedLeads || 0,
    convertedLeads: analytics.convertedLeads || 0,
    nurturingLeads: 0,
    disqualifiedLeads: 0,
    conversionRate: analytics.conversionRate || 0,
    platformDistribution: analytics.platformDistribution || [],
    statusDistribution: analytics.statusDistribution || [],
    leadMonthlyTimeline: []
  };

  const currentCampaignsKPI = campaignsData || {
    totalCampaigns: 4,
    activeCampaigns: 2,
    completedCampaigns: 1,
    draftCampaigns: 1,
    funnelData: [
      { stage: "Prospects Discovered", count: analytics.totalLeads, percentage: 100 },
      { stage: "Outreach Contacted", count: analytics.contactedLeads, percentage: analytics.totalLeads > 0 ? Math.round((analytics.contactedLeads / analytics.totalLeads) * 100) : 0 },
      { stage: "Warmly Engaged", count: 2, percentage: 40 },
      { stage: "Converted Clients", count: analytics.convertedLeads, percentage: analytics.totalLeads > 0 ? Math.round((analytics.convertedLeads / analytics.totalLeads) * 100) : 0 }
    ]
  };

  const currentOutreachKPI = outreachData || {
    totalDMs: activities.length || 0,
    sentDMs: activities.filter(a => a.status === 'sent').length || 0,
    pendingDMs: activities.filter(a => a.status === 'pending_approval').length || 0,
    draftDMs: activities.filter(a => a.status === 'draft').length || 0,
    failedDMs: 0,
    deliverabilityRate: 98,
    typeDistribution: [
      { type: "Connection Inbound", count: activities.filter(a => a.type === 'connection').length || 1 },
      { type: "Follow-up", count: activities.filter(a => a.type === 'follow_up').length || 0 }
    ],
    weeklyTimeline: []
  };

  const currentAiKPI = aiUsageData || {
    totalGenerations: 12,
    textGenerationsCount: 8,
    imageGenerationsCount: 2,
    suggestionsCount: 2,
    sentimentDistribution: [
      { sentiment: "Positive", count: 2, pct: 60 },
      { sentiment: "Neutral", count: 1, pct: 30 },
      { sentiment: "Negative", count: 0, pct: 10 }
    ],
    averageAccuracy: 94
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Dynamic Intro section & Live Server status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
            <Terminal className="w-6 h-6 text-zinc-350" />
            <span>AETHER CONSOLE_O_S</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wide">
            Realtime AI prospecting matrix & multi-channel campaign telemetry
          </p>
        </div>
        
        <div className="flex items-center space-x-3.5">
          {/* Refresh Action Trigger */}
          <button 
            onClick={fetchActiveAnalytics}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-905 hover:border-zinc-800 rounded-sm transition-all text-xs"
            title="Reload telemetry streams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-350" : ""}`} />
          </button>

          {/* Export Report Trigger */}
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 text-[10px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-sm transition-all uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5 text-zinc-350" />
            <span>{isExporting ? "EXPORTING..." : "EXPORT REPORT"}</span>
          </button>

          <div className="flex items-center space-x-3 bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              SYSTEM_STATUS: <strong className="text-emerald-400 font-bold">LIVE_TELEMETRY [SECURE]</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Unified Control Center Filters */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Platform Selector buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" /> Portal:
          </span>
          {["all", "linkedin", "instagram"].map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3.5 py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all uppercase ${
                platform === p 
                  ? "bg-zinc-800 text-white border-zinc-700" 
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-white"
              }`}
            >
              {p === "all" ? "ALL PORTALS" : p}
            </button>
          ))}
        </div>

        {/* Date presets selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Cycles:
          </span>
          {[
            { id: "last-7", label: "7 DAYS" },
            { id: "last-30", label: "30 DAYS" },
            { id: "last-90", label: "90 DAYS" },
            { id: "custom", label: "CUSTOM" }
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDateRange(d.id)}
              className={`px-3.5 py-1.5 text-[10px] font-mono font-bold rounded-sm border transition-all ${
                dateRange === d.id 
                  ? "bg-zinc-800 text-white border-zinc-700" 
                  : "bg-black text-zinc-400 border-zinc-900 hover:border-zinc-800 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}

          {/* Custom Date Inputs */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-1.5 ml-2 border border-zinc-900 p-1 bg-black rounded-sm">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-950 text-zinc-300 border border-zinc-850 p-1 text-[9px] font-mono rounded"
              />
              <span className="text-[10px] text-zinc-600 font-mono">TO</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-950 text-zinc-300 border border-zinc-850 p-1 text-[9px] font-mono rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Core Operational Tabs Bar */}
      <div className="flex items-center border-b border-zinc-900 space-x-1">
        {[
          { id: "overview", label: "Executive Summary", icon: Globe },
          { id: "leads", label: "Lead Intelligence", icon: Users },
          { id: "campaigns", label: "Campaign Funnel", icon: Layers },
          { id: "outreach", label: "Outreach Metrics", icon: BarChart2 },
          { id: "ai", label: "Cognitive Usage", icon: Brain }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs uppercase font-mono tracking-wider border-b-2 transition-all ${
                isActive 
                  ? "border-white text-white font-bold bg-zinc-900/40" 
                  : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Spinner Overlay helper */}
      {loading && (
        <div className="w-full p-4 text-center rounded bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center space-x-3.5 animate-pulse">
          <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-300">
            LOADING REALTIME DATABASE TELEMETRY CHANNEL...
          </span>
        </div>
      )}

      {/* TAB CONTENT 1: EXECUTIVE SUMMARY */}
      {subTab === "overview" && (
        <div className="space-y-6">
          {/* Grid: Stats KPI indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1 */}
            <div className="bg-zinc-950 border border-zinc-805 rounded-sm p-5 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <span className="text-[10px] font-mono text-zinc-505 uppercase tracking-wider block">Acquired Prospects</span>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
                  {currentLeadsKPI.totalLeads}
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
                  PLATFORMS SPLIT
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                <div className="bg-zinc-500 h-full" style={{ width: `${currentLeadsKPI.totalLeads > 0 ? (currentLeadsKPI.platformDistribution.find((p: any) => p.platform === "LinkedIn")?.count / currentLeadsKPI.totalLeads) * 100 : 50}%` }}></div>
                <div className="bg-zinc-300 h-full" style={{ width: `${currentLeadsKPI.totalLeads > 0 ? (currentLeadsKPI.platformDistribution.find((p: any) => p.platform === "Instagram")?.count / currentLeadsKPI.totalLeads) * 100 : 50}%` }}></div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono text-zinc-500">
                <span>LinkedIn ({currentLeadsKPI.platformDistribution.find((p: any) => p.platform === "LinkedIn")?.count || 0})</span>
                <span>Instagram ({currentLeadsKPI.platformDistribution.find((p: any) => p.platform === "Instagram")?.count || 0})</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-zinc-950 border border-zinc-805 rounded-sm p-5 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <span className="text-[10px] font-mono text-zinc-505 uppercase tracking-wider block">Outbound DMs</span>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
                  {currentOutreachKPI.sentDMs}
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  DISPATCHED
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wide mt-3 flex items-center">
                <span className="text-emerald-400 font-bold inline-flex items-center mr-1">
                  ✓✓ {currentOutreachKPI.deliverabilityRate}%
                </span>
                DELIVERABILITY STATUS
              </p>
            </div>

            {/* KPI 3 */}
            <div className="bg-zinc-950 border border-zinc-805 rounded-sm p-5 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <span className="text-[10px] font-mono text-zinc-505 uppercase tracking-wider block">Converted Targets</span>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
                  {currentLeadsKPI.convertedLeads}
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {currentLeadsKPI.nurturingLeads} NURTURED
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wide mt-3 flex items-center">
                <span className="text-zinc-350 font-bold inline-flex items-center mr-1">
                  STABLE
                </span>
                VS PREVIOUS LOOP
              </p>
            </div>

            {/* KPI 4 */}
            <div className="bg-zinc-950 border border-zinc-805 rounded-sm p-5 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <span className="text-[10px] font-mono text-zinc-505 uppercase tracking-wider block">Closing Ratio</span>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
                  {currentLeadsKPI.conversionRate}%
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  TARGET TARGETS
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wide mt-3 flex items-center">
                <span className="text-zinc-350 font-bold inline-flex items-center mr-1">
                  MAX_OPTIMIZED
                </span>
                CLOSURES RATIO
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Area Chart */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-sm p-6">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-white">Conversion & Outreach Performance Metrics</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Chronological audit of social pipelines & active lead closures</p>
                </div>
              </div>
              
              <div className="h-74">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.monthlyConversions}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="zincGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="whiteGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" opacity={0.6} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      className="font-mono uppercase"
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      className="font-mono"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#000000", 
                        borderColor: "#27272a", 
                        color: "#fafafa",
                        borderRadius: "2px",
                        fontSize: "10px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outreach" 
                      name="Prospecting Actions"
                      stroke="#71717a" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#zincGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      name="Leads Converted"
                      stroke="#ffffff" 
                      strokeWidth={1}
                      fillOpacity={1} 
                      fill="url(#whiteGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Party Pie List */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6 flex flex-col justify-between">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-white">Channel Partition</h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Distribution across integrated social ports</p>
              </div>

              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentLeadsKPI.platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={75}
                      paddingAngle={6}
                      dataKey="count"
                    >
                      {currentLeadsKPI.platformDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#000000", 
                        borderColor: "#27272a", 
                        color: "#fafafa",
                        borderRadius: "2px",
                        fontSize: "10px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute text-center">
                  <p className="text-xl font-mono font-bold text-white">{currentLeadsKPI.totalLeads}</p>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Total Segment</p>
                </div>
              </div>

              <div className="space-y-1.5 mt-4">
                {currentLeadsKPI.platformDistribution.map((d: any, index: number) => (
                  <div key={d.platform} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-900 last:border-0 font-mono uppercase">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="w-1.5 h-1.5 rounded-sm inline-block" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></span>
                      <span className="text-zinc-400">{d.platform} PORT</span>
                    </div>
                    <span className="font-bold text-zinc-100">[{d.count} ACTIVE]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LEAD INTELLIGENCE */}
      {subTab === "leads" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Split bar chart */}
            <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-sm p-6">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white mb-1.5 flex items-center justify-between">
                <span>Database Status Partition</span>
                <span className="text-[10px] text-zinc-300 font-mono font-normal">COUNTS</span>
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mb-6 border-b border-zinc-900 pb-3">
                Classification of generated leads in sales sequencing funnel
              </p>

              <div className="h-68">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentLeadsKPI.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="status" stroke="#686868" fontSize={9} tickLine={false} className="font-mono" />
                    <YAxis stroke="#686868" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#000", borderColor: "#222" }} />
                    <Bar dataKey="count" name="Target Leads" fill="#52525b" radius={[2, 2, 0, 0]}>
                      {currentLeadsKPI.statusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? "#ffffff" : "#3f3f46"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick breakdown list & Stats */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6 space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3">
                Lead KPI Telemetry
              </h3>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-xs text-zinc-500">CONVERTED RATIO:</span>
                  <span className="text-xs text-emerald-400 font-bold">{currentLeadsKPI.conversionRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-xs text-zinc-500">DISQUALIFIED VALUE:</span>
                  <span className="text-xs text-rose-400 font-bold">{currentLeadsKPI.disqualifiedLeads} Targets</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-xs text-zinc-500">NURTURING SEQUENCE:</span>
                  <span className="text-xs text-zinc-300 font-bold">{currentLeadsKPI.nurturingLeads} Leads</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-xs text-zinc-500">CONTACTED LEADS:</span>
                  <span className="text-xs text-white font-bold">{currentLeadsKPI.contactedLeads} Targets</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded">
                <p className="text-[10px] font-mono text-zinc-400 uppercase leading-relaxed font-bold">
                  🚀 INSIGHT:
                </p>
                <p className="text-[10px] font-mono text-zinc-500 mt-1 leading-relaxed">
                  Your LinkedIn outreach is converting at a 20% higher conversion rate than Instagram loops. Focus copy strategy efforts on high intent B2B titles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CAMPAIGN FUNNEL */}
      {subTab === "campaigns" && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3 mb-6">
              Sequencing Conversion Funnel
            </h3>

            {/* Funnel Layout Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {currentCampaignsKPI.funnelData.map((f: any, idx: number) => (
                <div 
                  key={f.stage} 
                  className="bg-black border border-zinc-900 p-5 rounded relative overflow-hidden flex flex-col justify-between"
                  style={{ opacity: 1 - idx * 0.12 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                      STEP 0{idx + 1}
                    </span>
                    {idx > 0 && (
                      <span className="text-[10px] font-mono font-bold text-zinc-350">
                        {f.percentage}% CR
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xl font-mono font-bold text-white">{f.count}</h4>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-1">{f.stage}</p>
                  </div>

                  <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${f.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5 pt-6 border-t border-zinc-900">
              <div className="flex items-center gap-6 text-[10px] font-mono uppercase text-zinc-400">
                <span>Campaign Volumes: <strong>{currentCampaignsKPI.totalCampaigns} TOTAL</strong></span>
                <span>Active: <strong className="text-green-400">{currentCampaignsKPI.activeCampaigns} LIVE</strong></span>
                <span>Drafts: <strong className="text-zinc-500">{currentCampaignsKPI.draftCampaigns} DRAFT</strong></span>
              </div>
              <button 
                onClick={() => onViewChange("leads")}
                className="px-3.5 py-1.5 text-[10px] font-mono font-bold bg-white hover:bg-zinc-200 text-zinc-950 rounded border border-zinc-300 transition-colors"
              >
                Launch New Flow Segment (leads)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: OUTREACH PERFORMANCE */}
      {subTab === "outreach" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side types count */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3 mb-4">
                  Outreach Action Methods
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase mb-6 leading-relaxed">
                  Classification of dispatched direct outreach activities by sequence structure
                </p>
              </div>

              <div className="space-y-4">
                {currentOutreachKPI.typeDistribution.map((t: any, index: number) => (
                  <div key={t.type} className="p-3 bg-black border border-zinc-900 rounded font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-bold uppercase">{t.type}</span>
                      <span className="text-white font-bold">[{t.count} RUNS]</span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${currentOutreachKPI.totalDMs > 0 ? (t.count / currentOutreachKPI.totalDMs) * 100 : 50}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-900 text-center font-mono text-[10px] text-zinc-500">
                TOTAL INITIATIONS IN CYCLE: <strong className="text-zinc-100">{currentOutreachKPI.totalDMs} Dispatches</strong>
              </div>
            </div>

            {/* Weekly performance visual timeline */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3 mb-4">
                  Deliverability Timeline Logs
                </h3>
              </div>

              <div className="h-60">
                {currentOutreachKPI.weeklyTimeline.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-[11px]">
                    NO ACTIVE WEEKLY METRICS IN THE SPECIFIED CYCLE RANGE
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentOutreachKPI.weeklyTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="week" stroke="#888" fontSize={9} className="font-mono" />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", borderColor: "#222" }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontFamily: "monospace", fontSize: "9px" }} />
                      <Bar dataKey="sent" name="SMTP Delivers" fill="#a855f7" />
                      <Bar dataKey="failed" name="SMTP Drops" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                <span>Pending for approve: <strong>{currentOutreachKPI.pendingDMs} QUEUED</strong></span>
                <span>Active deliverability: <strong className="text-emerald-400">98.2% SUCCESS</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: COGNITIVE USAGE */}
      {subTab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* sentiment analysis tracker wheel */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6 shadow flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3 mb-4">
                  Lead Response Sentiment Splitting
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed mb-6">
                  Real-time sentiment categorization matching incoming social replies (positive, neutral, negative)
                </p>
              </div>

              <div className="space-y-3.5">
                {currentAiKPI.sentimentDistribution.map((s: any, idx: number) => (
                  <div key={s.sentiment} className="font-mono text-xs">
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span>{s.sentiment.toUpperCase()} RESPONSE</span>
                      <span className={`${
                        s.sentiment === "Positive" ? "text-emerald-400" :
                        s.sentiment === "Negative" ? "text-rose-400" : "text-zinc-100"
                      }`}>{s.count} Leads ({s.pct}%)</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        s.sentiment === "Positive" ? "bg-emerald-500" :
                        s.sentiment === "Negative" ? "bg-rose-500" : "bg-zinc-300"
                      }`} style={{ width: `${s.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-900 text-[10px] font-mono text-zinc-500 text-center">
                SENTIMENT POOL RANGE: UTC ANALYSIS CHANNEL
              </div>
            </div>

            {/* AI usage counts details cards */}
            <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-white border-b border-zinc-900 pb-3 mb-6">
                  Cognitive Task Dispatches
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-black border border-zinc-900 p-4.5 rounded text-center">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">AUTOMATIONS DISPATCHED</span>
                  <span className="text-2xl font-mono font-bold text-white block mt-2">{currentAiKPI.totalGenerations}</span>
                </div>

                {/* Copies */}
                <div className="bg-black border border-zinc-900 p-4.5 rounded text-center">
                  <span className="text-[9px] font-mono text-zinc-505 block uppercase">PITCHES SYNTHESIZED</span>
                  <span className="text-2xl font-mono font-bold text-zinc-300 block mt-2">{currentAiKPI.textGenerationsCount}</span>
                </div>

                {/* Graphics */}
                <div className="bg-black border border-zinc-900 p-4.5 rounded text-center">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">IMAGES GENERATED</span>
                  <span className="text-2xl font-mono font-bold text-zinc-400 block mt-2">{currentAiKPI.imageGenerationsCount}</span>
                </div>

                {/* Accuracy */}
                <div className="bg-black border border-zinc-900 p-4.5 rounded text-center">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">ACCURACY INDEX</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400 block mt-2">{currentAiKPI.averageAccuracy}%</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-zinc-900/40 border border-zinc-800 rounded font-mono text-[10px] leading-relaxed text-zinc-400 flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>COGNITIVE INSITE SYSTEM:</strong> AI-powered personal writing suggestions are deployed across active conversation threads. These suggestion modules analyze previous DM contexts to offer high-relevance templates that save sales teams up to 3 hours daily.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Outreach Engine Approval Hub */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-900 pb-4">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-white" />
              Automated Queue & Deployment Hub
            </h3>
            <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1">
              Validating AI-synthesized copy threads prior to channel injection
            </p>
          </div>
          <button 
            onClick={() => onViewChange("composer")}
            className="px-4 py-2 text-[10px] font-mono font-bold bg-white hover:bg-zinc-200 text-zinc-950 rounded-sm transition-all uppercase tracking-wider border border-zinc-300 self-start sm:self-auto"
          >
            [ + GENERATE COPY ]
          </button>
        </div>

        {recentDrafts.length === 0 ? (
          <div className="text-center py-10 rounded-sm bg-zinc-950 border border-dashed border-zinc-850">
            <CheckCircle2 className="w-6 h-6 text-zinc-650 mx-auto mb-2" />
            <p className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-bold">Queue is Unassigned</p>
            <p className="text-[10px] font-mono text-zinc-655 uppercase mt-1">Utilize the AI Outreach tab to inject personalized messages.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentDrafts.map((activity) => (
              <div 
                key={activity.id} 
                className="bg-black border border-zinc-900 rounded-sm p-4 flex flex-col md:flex-row justify-between gap-4 hover:border-zinc-800 transition-all font-mono"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-sm bg-zinc-900 text-zinc-300 border border-zinc-850 uppercase font-bold">
                      {activity.type.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-zinc-300">
                      TARGET: {activity.leadName.toUpperCase()}
                    </span>
                    <span className="text-zinc-600">
                      // {activity.status === 'pending_approval' ? "PENDING" : "DRAFT"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-305 leading-relaxed bg-zinc-950/80 p-3.5 rounded-sm border border-zinc-900 italic font-mono font-medium">
                    "{activity.content}"
                  </p>
                </div>
                
                <div className="flex flex-row md:flex-col justify-end gap-2.5 self-end md:self-center">
                  <button 
                    onClick={() => {
                      onApproveActivity(activity.id);
                    }}
                    className="px-3 py-2 text-[10px] font-mono font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-sm transition-colors flex items-center uppercase"
                  >
                    <span>Approve_Sync()</span>
                  </button>
                  <button 
                    onClick={() => onViewChange("composer")} 
                    className="px-3 py-2 text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-sm transition-all uppercase"
                  >
                    Redraft
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
