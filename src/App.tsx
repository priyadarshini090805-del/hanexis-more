import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import LeadsView from "./components/LeadsView";
import AIComposerView from "./components/AIComposerView";
import ContentPlannerView from "./components/ContentPlannerView";
import InboxView from "./components/InboxView";
import IntegrationsView from "./components/IntegrationsView";

import { 
  getLeads, 
  createLead, 
  updateLead, 
  deleteLead,
  getOutreachActivities, 
  createOutreachActivity, 
  updateOutreachStatus, 
  getScheduledPosts, 
  createScheduledPost, 
  updateScheduledPost,
  getConversations, 
  sendChatMessage, 
  getIntegrations, 
  toggleIntegration, 
  getAnalytics 
} from "./lib/api";

import { Lead, OutreachActivity, ScheduledPost, Conversation, AnalyticsSummary } from "./types";
import { Sparkles, Bell, Wifi, Cpu, Settings, MessageSquare, AlertTriangle, CalendarRange } from "lucide-react";

export default function App() {
  
  // App views: 'dashboard' | 'leads' | 'composer' | 'content' | 'inbox' | 'integrations'
  const [currentView, setCurrentView] = useState<'dashboard' | 'leads' | 'composer' | 'content' | 'inbox' | 'integrations'>("dashboard");
  
  // Key state lists
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<OutreachActivity[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [integrations, setIntegrations] = useState({
    linkedinJoined: true,
    linkedinUsername: "hariprabu-business",
    instagramJoined: false,
    instagramUsername: ""
  });
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    totalLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    platformDistribution: [],
    statusDistribution: [],
    monthlyConversions: []
  });

  // Selected lead context for writing AI outreach copy
  const [aiSelectedLead, setAiSelectedLead] = useState<Lead | null>(null);

  // Status alerts / Toast states
  const [alertText, setAlertText] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning'>('info');

  const triggerAlert = (text: string, type: 'info' | 'success' | 'warning' = 'success') => {
    setAlertText(text);
    setAlertType(type);
    setTimeout(() => {
      setAlertText(null);
    }, 4000);
  };

  // Initial load data loader
  const loadAllData = async () => {
    try {
      const [leadsData, activitiesData, postsData, convsData, intsData, statsData] = await Promise.all([
        getLeads(),
        getOutreachActivities(),
        getScheduledPosts(),
        getConversations(),
        getIntegrations(),
        getAnalytics()
      ]);

      setLeads(leadsData);
      setActivities(activitiesData);
      setPosts(postsData);
      setConversations(convsData);
      setIntegrations(intsData);
      setAnalytics(statsData);
    } catch (err: any) {
      console.error("Failed loading backend content: ", err);
      triggerAlert("System error gathering analytics metadata.", "warning");
    }
  };

  useEffect(() => {
    loadAllData();
    // Poll analytics and conversations every 10 seconds for real-time inbox replies update
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // LEADS ACTIONS
  const handleAddLead = async (leadParams: Partial<Lead>) => {
    try {
      await createLead(leadParams);
      await loadAllData();
      triggerAlert(`Added target: "${leadParams.name}" successfully.`);
    } catch (err: any) {
      triggerAlert("Could not add target profile details.", "warning");
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: any) => {
    try {
      await updateLead(id, { status });
      await loadAllData();
      triggerAlert(`Lead status updated to ${status.toUpperCase()}`);
    } catch (err) {
      triggerAlert("Could not update status.", "warning");
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      await loadAllData();
      triggerAlert("Target profile removed.", "info");
    } catch (err) {
      triggerAlert("Could not delete lead profile.", "warning");
    }
  };

  // OUTREACH ACTIONS
  const handleLogActivity = async (activityParams: Partial<OutreachActivity>) => {
    try {
      await createOutreachActivity(activityParams);
      await loadAllData();
      triggerAlert("Outreach proposal queued.");
    } catch (err) {
      triggerAlert("Outreach queue add failure.", "warning");
    }
  };

  const handleApproveActivity = async (id: string) => {
    try {
      await updateOutreachStatus(id, "sent");
      await loadAllData();
      triggerAlert("Lead outreach validated and deployed successfully!");
    } catch (err) {
      triggerAlert("Could not deploy action.", "warning");
    }
  };

  // CONTENT PLANNER ACTIONS
  const handleAddPost = async (postParams: Partial<ScheduledPost>) => {
    try {
      await createScheduledPost(postParams);
      await loadAllData();
      triggerAlert("Post scheduled successfully.");
    } catch (err) {
      triggerAlert("Content queue failure.", "warning");
    }
  };

  const handleUpdatePostStatus = async (id: string, updates: Partial<ScheduledPost>) => {
    try {
      await updateScheduledPost(id, updates);
      await loadAllData();
      triggerAlert("Updated post configurations.");
    } catch (err) {
      triggerAlert("Failed content rewrite.", "warning");
    }
  };

  // INBOX CHAT ACTIONS
  const handleSendMessage = async (convId: string, sender: 'lead' | 'user', text: string) => {
    try {
      await sendChatMessage(convId, sender, text);
      await loadAllData();
      triggerAlert("Replied to channel inbox.");
    } catch (err) {
      triggerAlert("Failed transmitting message.", "warning");
    }
  };

  // INTEGRATION ACTIONS
  const handleToggleIntegration = async (platform: 'linkedin' | 'instagram', username?: string) => {
    try {
      const updated = await toggleIntegration(platform, username);
      setIntegrations(updated);
      await loadAllData();
      triggerAlert(`Platform sync updated successfully.`);
    } catch (err) {
      triggerAlert("Failed matching authorization handshake.", "warning");
    }
  };

  // Transition to writing AI pitch helper
  const handleSelectLeadForAI = (lead: Lead) => {
    setAiSelectedLead(lead);
    setCurrentView("composer");
  };

  // Count active unread notifications
  const unreadMessagesCount = conversations.filter(c => c.unread).length;

  return (
    <div className="flex bg-black text-zinc-350 font-sans antialiased min-h-screen">
      
      {/* 1. Sidebar Nav */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          if (view !== "composer") setAiSelectedLead(null); // Clear selected if leaving composer
        }}
        unreadCount={unreadMessagesCount}
      />

      {/* 2. Main Work Panel */}
      <div className="flex-1 flex flex-col justify-between overflow-x-hidden min-h-screen">
        
        {/* Top Header Panel */}
        <header className="h-16 px-8 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Node:</span>
            <span className="text-[10px] font-mono font-bold text-white uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-sm">
              [NODE_ALPHA_CORE]
            </span>
          </div>

          <div className="flex items-center space-x-6">
            
            {/* Quick telemetry indicators */}
            <div className="hidden sm:flex items-center space-x-4 border-r border-zinc-900 pr-5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
              <span className="flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                <span>COGNITIVE: GEMINI_3.5_LIVE</span>
              </span>
              <span className="flex items-center">
                <Wifi className="w-3.5 h-3.5 mr-1 text-green-500" />
                <span>LATENCY: 12ms</span>
              </span>
            </div>

            {/* Notifications Button */}
            <button 
              onClick={() => {
                if (unreadMessagesCount > 0) {
                  setCurrentView("inbox");
                  triggerAlert("Navigated to Inbox with unread logs.", "info");
                } else {
                  triggerAlert("No active notifications on record.", "info");
                }
              }}
              className="relative p-2 text-zinc-400 hover:text-white rounded-sm hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800"
              title="Inbox Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              )}
            </button>

            {/* Config metadata button */}
            <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-sm text-zinc-400">
              MAY 27, 2026 // UTC
            </span>
          </div>
        </header>

        {/* Global Floating status alerts (Toasts) */}
        {alertText && (
          <div className="fixed top-20 right-8 z-55 max-w-sm w-full animate-slide-in">
            <div className={`p-4 rounded-sm border flex items-center space-x-3 shadow-lg ${
              alertType === 'warning' 
                ? 'bg-rose-950/90 border-rose-800 text-rose-300' 
                : alertType === 'info'
                ? 'bg-zinc-900/95 border-zinc-800 text-zinc-300'
                : 'bg-zinc-900/90 border-zinc-850 text-white shadow-[0_4px_12px_rgba(255,255,255,0.05)]'
            }`}>
              {alertType === 'warning' ? (
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0" />
              ) : (
                <Sparkles className="w-4.5 h-4.5 text-zinc-100 flex-shrink-0" />
              )}
              <span className="text-xs font-mono font-medium">{alertText}</span>
            </div>
          </div>
        )}

        {/* 3. Main interactive canvas views switcher */}
        <main className="flex-1 p-8 overflow-y-auto w-full mx-auto pb-16 bg-zinc-950/20">
          {currentView === "dashboard" && (
            <DashboardView 
              analytics={analytics} 
              activities={activities}
              leads={leads}
              onViewChange={(view) => setCurrentView(view)}
              onApproveActivity={handleApproveActivity}
            />
          )}

          {currentView === "leads" && (
            <LeadsView 
              leads={leads} 
              activities={activities}
              onAddLead={handleAddLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onDeleteLead={handleDeleteLead}
              onSelectLeadForAI={handleSelectLeadForAI}
            />
          )}

          {currentView === "composer" && (
            <AIComposerView 
              leads={leads}
              initialSelectedLead={aiSelectedLead}
              onLogActivity={handleLogActivity}
              onViewChange={(view) => setCurrentView(view)}
            />
          )}

          {currentView === "content" && (
            <ContentPlannerView 
              posts={posts}
              onAddPost={handleAddPost}
              onUpdatePostStatus={handleUpdatePostStatus}
            />
          )}

          {currentView === "inbox" && (
            <InboxView 
              conversations={conversations}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentView === "integrations" && (
            <IntegrationsView 
              integrations={integrations}
              onToggleIntegration={handleToggleIntegration}
            />
          )}
        </main>

        {/* Bottom Status Bar (Geometric Balance Core Layout Element) */}
        <footer className="h-8 border-t border-zinc-900 bg-zinc-950/80 flex items-center px-8 justify-between text-[9px] font-mono text-zinc-500 selection:bg-zinc-800/60">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5 p-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
              CLUSTER_WEST_02_STABLE
            </span>
            <span className="hidden md:inline">SYSTEM_ID: 88AF-331X-P7</span>
            <span className="hidden md:inline">NODE CORE: ACTIVE</span>
          </div>
          <div className="flex gap-6 uppercase">
            <span>Ver: 2.6.0 [STABLE_RUN]</span>
            <span className="text-zinc-650">MEMORY: 5.4GB / 16GB</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
