import React, { useState, useEffect } from "react";
import { 
  Link2, 
  Linkedin, 
  Instagram, 
  Globe, 
  Database, 
  CheckCircle, 
  X, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Zap,
  Check,
  Power,
  Play
} from "lucide-react";

interface IntegrationsViewProps {
  integrations: {
    linkedinJoined: boolean;
    linkedinUsername: string;
    instagramJoined: boolean;
    instagramUsername: string;
  };
  onToggleIntegration: (platform: 'linkedin' | 'instagram', username?: string) => void;
}

interface DBIntegration {
  platform: "LINKEDIN" | "INSTAGRAM";
  isConnected: boolean;
  username: string;
  expiresAt: string | null;
  lastSyncAt: string | null;
  tokenStatus: "VALID" | "EXPIRED" | "ROTATING" | "MISSING";
}

export default function IntegrationsView({ integrations: propIntegrations, onToggleIntegration }: IntegrationsViewProps) {
  const [dbConnections, setDbConnections] = useState<DBIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingPlat, setSyncingPlat] = useState<"linkedin" | "instagram" | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState<"linkedin" | "instagram" | null>(null);
  
  // Handlers for manual prompt input modal
  const [showSyncModal, setShowSyncModal] = useState<"linkedin" | "instagram" | null>(null);
  const [inputUsername, setInputUsername] = useState("");
  
  // Log telemetry lists
  const [webhookLogs, setWebhookLogs] = useState<Array<{
    id: string;
    platform: string;
    event: string;
    ip: string;
    date: string;
    status: string;
    payload: any;
  }>>([
    { id: "wh-1", platform: "LinkedIn", event: "lead_status_changed", ip: "108.162.192.12", date: "Just now", status: "success", payload: { leadId: "jessica-miller-cloud", status: "CONTACTED" } },
    { id: "wh-2", platform: "Instagram", event: "message_received", ip: "172.67.140.24", date: "15 mins ago", status: "success", payload: { handle: "chloe_vane_design", message: "Outsource inquiry proposal" } },
    { id: "wh-3", platform: "LinkedIn", event: "webhook_handshake", ip: "108.162.192.12", date: "Yesterday", status: "success", payload: { handshake: "verified", secure_checksum: "2f31a2" } }
  ]);

  const [feedbackAlert, setFeedbackAlert] = useState<{
    msg: string;
    type: "success" | "warning" | "info";
  } | null>(null);

  const triggerAlert = (msg: string, type: "success" | "warning" | "info" = "success") => {
    setFeedbackAlert({ msg, type });
    setTimeout(() => {
      setFeedbackAlert(null);
    }, 5000);
  };

  // 1. Fetch live connections from database
  const loadDatabaseConnections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        if (data.connections) {
          setDbConnections(data.connections);
        }
      }
    } catch (err: any) {
      console.error("Failed loading backend integration statuses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseConnections();
  }, []);

  // 2. Setup OAuth Popup Listener matching secure postMessage requirements!
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Restrict validation to current origins
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const platform = event.data.platform;
        triggerAlert(`Secure channel handshake completed for ${platform}! Synchronization triggered.`, "success");
        loadDatabaseConnections();
        // Sync parent React properties to propagate top-level dashboard refresh
        if (onToggleIntegration && (platform === "linkedin" || platform === "instagram")) {
          onToggleIntegration(platform, "connected-user");
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onToggleIntegration]);

  // 3. Trigger popup-based OAuth authorization flow
  const initiateOAuthHandshake = async (platform: "linkedin" | "instagram") => {
    try {
      triggerAlert(`Constructing permission-grant keys for ${platform}...`, "info");
      const urlResponse = await fetch(`/api/integrations/oauth/url?platform=${platform}`);
      if (!urlResponse.ok) {
        throw new Error("Unable to construct authorization routes.");
      }

      const { url } = await urlResponse.json();
      
      // Open the OAuth authorization popup to direct external auth endpoint
      const authWindow = window.open(
        url,
        "oauth_handshake_popup",
        "width=620,height=750,status=no,resizable=yes"
      );

      if (!authWindow) {
        triggerAlert("Handshake window blocked. Please permit popups to establish links.", "warning");
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert(`OAuth Construction rejected: ${err.message}`, "warning");
    }
  };

  // 4. Force manual synchronization trigger
  const triggerManualSync = async (platform: "linkedin" | "instagram") => {
    setSyncingPlat(platform);
    try {
      const res = await fetch(`/api/integrations/${platform}/sync`, {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Synchronization queue rejected dispatcher.");
      }

      const data = await res.json();
      triggerAlert(data.message || `${platform} pull job scheduled. Check leads list in 5 sec!`, "success");
      
      // Reload states
      setTimeout(() => {
        loadDatabaseConnections();
      }, 2000);
    } catch (err: any) {
      triggerAlert(`Sync trigger failed: ${err.message}`, "warning");
    } finally {
      setSyncingPlat(null);
    }
  };

  // 5. Uncouple/Disconnect Integration channel
  const disconnectIntegration = async (platform: "linkedin" | "instagram") => {
    try {
      const res = await fetch(`/api/integrations/${platform}/disconnect`, {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Disconnection failed.");
      }

      triggerAlert(`Unlinked ${platform} account connection successful.`, "success");
      loadDatabaseConnections();

      // Trigger legacy toggle callback to clean old client states
      onToggleIntegration(platform);
    } catch (err: any) {
      triggerAlert(`Disconnect failed: ${err.message}`, "warning");
    }
  };

  // Modal setup helper (when using direct username binding instead of real OAuth popup)
  const handleOpenSync = (platform: "linkedin" | "instagram") => {
    const defaultUser = platform === "linkedin" 
      ? propIntegrations.linkedinUsername || "hariprabu-business" 
      : propIntegrations.instagramUsername || "hariprabu_insta";
    setInputUsername(defaultUser);
    setShowSyncModal(platform);
  };

  const commitManualHandleSync = async () => {
    if (!showSyncModal) return;
    try {
      onToggleIntegration(showSyncModal, inputUsername.trim());
      triggerAlert(`Enqueued account synchronization for handle: "${inputUsername}"`, "success");
      setShowSyncModal(null);
      setTimeout(() => {
        loadDatabaseConnections();
      }, 1500);
    } catch (err: any) {
      triggerAlert(`Failed syncing handle: ${err.message}`, "warning");
    }
  };

  // Webhook action simulator! Incredibly interactive testing tool.
  const handleSimulateWebhook = async (platform: "linkedin" | "instagram") => {
    setSimulatingWebhook(platform);
    try {
      const randomEvent = platform === "linkedin" 
        ? "lead_status_changed" 
        : "message_received";
      
      const ip = "108.162.192.12";
      const payload = platform === "linkedin" 
        ? { event: "connection_created", leadName: "Marcus Vance", handle: "marcus-vance-b2b" }
        : { event: "message_received", sender: "Chloe Vane", text: "Stunning portfolio designs!" };

      const res = await fetch(`/api/integrations/webhook/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Simulator rejected.");

      // Record locally to log terminal view
      const newLog = {
        id: `wh-sim-${Date.now()}`,
        platform: platform === "linkedin" ? "LinkedIn" : "Instagram",
        event: randomEvent,
        ip,
        date: "Just now",
        status: "success",
        payload
      };

      setWebhookLogs(prev => [newLog, ...prev]);
      triggerAlert(`Simulated ${platform} webhook parsed & ingested. Check system logs!`, "success");
      loadDatabaseConnections();
    } catch (err: any) {
      triggerAlert(`Simulation failed: ${err.message}`, "warning");
    } finally {
      setSimulatingWebhook(null);
    }
  };

  // Reconcile props integrations with database state if db is loading/empty
  const linkedinActive = dbConnections.find(i => i.platform === "LINKEDIN")?.isConnected ?? propIntegrations.linkedinJoined;
  const linkedinUsernameVal = dbConnections.find(i => i.platform === "LINKEDIN")?.username || propIntegrations.linkedinUsername || "hariprabu-business";
  const linkedinTokenStatus = dbConnections.find(i => i.platform === "LINKEDIN")?.tokenStatus || (propIntegrations.linkedinJoined ? "VALID" : "MISSING");
  const linkedinLastSync = dbConnections.find(i => i.platform === "LINKEDIN")?.lastSyncAt;

  const instagramActive = dbConnections.find(i => i.platform === "INSTAGRAM")?.isConnected ?? propIntegrations.instagramJoined;
  const instagramUsernameVal = dbConnections.find(i => i.platform === "INSTAGRAM")?.username || propIntegrations.instagramUsername || "hariprabu_insta";
  const instagramTokenStatus = dbConnections.find(i => i.platform === "INSTAGRAM")?.tokenStatus || (propIntegrations.instagramJoined ? "VALID" : "MISSING");
  const instagramLastSync = dbConnections.find(i => i.platform === "INSTAGRAM")?.lastSyncAt;

  return (
    <div className="space-y-8 animate-fade-in text-sm text-zinc-300">
      
      {/* Alert Banner System */}
      {feedbackAlert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all animate-bounce ${
          feedbackAlert.type === "success" 
            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
            : feedbackAlert.type === "warning"
            ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
            : "bg-blue-950/20 border-blue-500/30 text-blue-300"
        }`}>
          {feedbackAlert.type === "success" ? <ShieldCheck className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium text-xs font-mono">{feedbackAlert.msg}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <Link2 className="w-8 h-8 text-zinc-205" />
            Integrations & Channel Pipeline
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Production-grade OAuth authorization tokens, resilient queue synchronization, and live telemetry webhook triggers.
          </p>
        </div>

        <button 
          onClick={loadDatabaseConnections} 
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 font-mono text-[11px] uppercase bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-zinc-400"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing Ports..." : "Refresh Status"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left main: Connection cards with extensive indicators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-90 w-full p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-sans font-semibold tracking-wider text-white uppercase">Linked Accounts</h3>
              <span className="text-[10px] font-mono text-zinc-500">PROVIDER_STRATEGY_PATTERN</span>
            </div>

            {/* LinkedIn Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              linkedinActive 
                ? "bg-zinc-900/60 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.06)]" 
                : "bg-zinc-900/30 border-zinc-900 hover:border-zinc-850"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    linkedinActive 
                      ? "bg-zinc-800 border-white text-white shadow" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}>
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-white text-sm">LinkedIn API Integration</h4>
                      {linkedinActive ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          <Zap className="w-2.5 h-2.5" /> ACTIVE LINK
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          UNCONNECTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {linkedinActive 
                        ? `Synchronized with professional handle: "${linkedinUsernameVal}"`
                        : "Authorize LinkedIn credentials using production OAuth popups to map incoming b2b profiles."
                      }
                    </p>

                    {/* Extended token metadata indicators */}
                    {linkedinActive && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3.5 pt-3.5 border-t border-zinc-900 text-[10px] font-mono">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>Last sync:</span>
                          <span className="text-zinc-300 text-[11px]">{linkedinLastSync ? new Date(linkedinLastSync).toLocaleTimeString() : "Pending sync"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Credentials:</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            linkedinTokenStatus === "VALID" ? "text-emerald-400 bg-emerald-500/5" : "text-amber-400 bg-amber-500/5"
                          }`}>{linkedinTokenStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations column */}
                <div className="flex flex-row sm:flex-col items-center justify-end gap-2 p-1 border-t sm:border-t-0 border-zinc-900 pt-3">
                  {linkedinActive ? (
                    <>
                      <button
                        onClick={() => triggerManualSync("linkedin")}
                        disabled={syncingPlat === "linkedin"}
                        className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-mono uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px]"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingPlat === "linkedin" ? "animate-spin" : ""}`} />
                        {syncingPlat === "linkedin" ? "Syncing..." : "Sync Now"}
                      </button>
                      <button
                        onClick={() => disconnectIntegration("linkedin")}
                        className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-mono uppercase bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/10 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px]"
                      >
                        <Power className="w-3 h-3" />
                        Disconnect
                      </button>
                    </>
                  ) : (
                     <div className="flex sm:flex-col gap-2 w-full">
                      <button
                        onClick={() => initiateOAuthHandshake("linkedin")}
                        className="w-full px-4 py-2 text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        OAuth Secure Connect
                      </button>
                      <button
                        onClick={() => handleOpenSync("linkedin")}
                        className="w-full px-3 py-1.5 text-xs font-normal bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-white rounded-xl transition-all"
                      >
                        Simulate Handle Connect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instagram Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              instagramActive 
                ? "bg-zinc-900/60 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.06)]" 
                : "bg-zinc-900/30 border-zinc-900 hover:border-zinc-850"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    instagramActive 
                      ? "bg-pink-600 border-pink-400 text-white shadow-lg shadow-pink-950/30" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}>
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-white text-sm">Instagram Graph Integration</h4>
                      {instagramActive ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          <Zap className="w-2.5 h-2.5" /> ACTIVE LINK
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          UNCONNECTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {instagramActive 
                        ? `Synchronized with professional handle: "${instagramUsernameVal}"`
                        : "Authorize Instagram Graph permissions through standard direct login windows for multi-user syncs."
                      }
                    </p>

                    {/* Extended token metadata indicators */}
                    {instagramActive && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3.5 pt-3.5 border-t border-zinc-900 text-[10px] font-mono">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>Last sync:</span>
                          <span className="text-zinc-300 text-[11px]">{instagramLastSync ? new Date(instagramLastSync).toLocaleTimeString() : "Pending sync"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Credentials:</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            instagramTokenStatus === "VALID" ? "text-emerald-400 bg-emerald-500/5" : "text-amber-400 bg-amber-500/5"
                          }`}>{instagramTokenStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations column */}
                <div className="flex flex-row sm:flex-col items-center justify-end gap-2 p-1 border-t sm:border-t-0 border-zinc-900 pt-3">
                  {instagramActive ? (
                    <>
                      <button
                        onClick={() => triggerManualSync("instagram")}
                        disabled={syncingPlat === "instagram"}
                        className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-mono uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px]"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingPlat === "instagram" ? "animate-spin" : ""}`} />
                        {syncingPlat === "instagram" ? "Syncing..." : "Sync Now"}
                      </button>
                      <button
                        onClick={() => disconnectIntegration("instagram")}
                        className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-mono uppercase bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/10 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px]"
                      >
                        <Power className="w-3 h-3" />
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex sm:flex-col gap-2 w-full">
                      <button
                        onClick={() => initiateOAuthHandshake("instagram")}
                        className="w-full px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-500 hover:text-white rounded-xl shadow-lg shadow-pink-950/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        OAuth Secure Connect
                      </button>
                      <button
                        onClick={() => handleOpenSync("instagram")}
                        className="w-full px-3 py-1.5 text-xs font-normal bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-white rounded-xl transition-all"
                      >
                        Simulate Handle Connect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Interactive Webhook logs & events sandbox */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-805 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <h3 className="text-sm font-sans font-semibold tracking-wider text-white uppercase flex items-center gap-1.5">
                  Webhook Event Sandbox
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 animate-pulse">● ALIVE</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Ingested payload logs in real-time. Test your callback endpoints using the simulator triggers below.
              </p>
            </div>

            {/* Simulated webhook test controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleSimulateWebhook("linkedin")}
                disabled={simulatingWebhook !== null}
                className="px-2.5 py-2 bg-zinc-900 border border-zinc-805 hover:bg-zinc-850 rounded-xl font-mono text-[10px] uppercase text-zinc-350 flex items-center justify-center gap-1"
              >
                <Play className="w-2.5 h-2.5 text-zinc-200" />
                Sim LinkedIn
              </button>
              <button
                onClick={() => handleSimulateWebhook("instagram")}
                disabled={simulatingWebhook !== null}
                className="px-2.5 py-2 bg-pink-950/20 border border-pink-900/20 hover:bg-pink-900/25 rounded-xl font-mono text-[10px] uppercase text-pink-300 flex items-center justify-center gap-1"
              >
                <Play className="w-2.5 h-2.5 text-pink-400" />
                Sim Insta
              </button>
            </div>

            {/* Captured logs screen */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {webhookLogs.length === 0 ? (
                <div className="text-center py-6 border border-zinc-900 rounded-xl text-zinc-600 font-mono text-xs">
                  No webhook packets captured yet.
                </div>
              ) : (
                webhookLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-2 hover:border-zinc-800 transition-colors">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        log.platform === "LinkedIn" ? "bg-zinc-850 text-zinc-200" : "bg-zinc-900 text-zinc-400"
                      }`}>{log.platform} Callback</span>
                      <span className="text-emerald-400 flex items-center font-bold">
                        <Check className="w-3 h-3 mr-0.5" />
                        200 OK
                      </span>
                    </div>
                    
                    <div className="text-xs text-zinc-400 space-y-1.5 leading-snug">
                      <p className="flex justify-between">
                        <span className="text-zinc-500">Payload:</span>
                        <strong className="text-zinc-300 font-mono text-[10px]">{log.event}</strong>
                      </p>
                      <pre className="text-[9px] bg-black p-2 rounded-lg text-emerald-400 font-mono overflow-x-auto border border-zinc-900">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                      <p className="text-[9px] text-zinc-650 font-mono flex items-center justify-between">
                        <span className="flex items-center"><Clock className="w-2.5 h-2.5 mr-1" /> {log.date}</span>
                        <span>IP: {log.ip}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 p-3.5 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-center text-[10px] text-zinc-500 font-mono">
              Production Webhook Ingress Port: 
              <strong className="text-zinc-300 block mt-1 select-all break-all overflow-x-auto bg-black p-1.5 rounded border border-zinc-900 uppercase">
                /api/integrations/webhook/[platform]
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Sync Handle Modal Popout */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in relative">
            <button
              onClick={() => setShowSyncModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            
            <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-zinc-200 animate-pulse" />
              Simulate Account Linking
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Account Handle ID</label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="E.g. brand-authority"
                className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-xs rounded-lg p-2.5 text-white outline-none"
              />
              <p className="text-[10px] text-zinc-500">Provides immediate integration state persistence for local development.</p>
            </div>

            <div className="pt-4 border-t border-zinc-850 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSyncModal(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitManualHandleSync}
                className="px-4 py-1.5 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Sync Channel Port
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
