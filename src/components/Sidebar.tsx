import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  CalendarRange, 
  MessageSquare, 
  Sliders, 
  Link2, 
  Activity,
  LogOut
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'leads' | 'composer' | 'content' | 'inbox' | 'integrations') => void;
  unreadCount: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
  highlight?: boolean;
}

export default function Sidebar({ currentView, onViewChange, unreadCount }: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "leads", label: "Leads Hub", icon: Users },
    { id: "composer", label: "AI Outreach", icon: Sparkles, highlight: true },
    { id: "content", label: "Content Calendar", icon: CalendarRange },
    { id: "inbox", label: "Inbox Assist", icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "integrations", label: "Channels & API", icon: Link2 },
  ];

  return (
    <aside className="w-68 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between h-screen sticky top-0 font-sans">
      {/* Branding Header Area */}
      <div className="p-6 border-b border-zinc-900">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center font-bold text-white border border-zinc-805">
              <Sparkles className="w-4.5 h-4.5 text-zinc-50" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-zinc-950 animate-soft-pulse"></div>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white uppercase flex items-center gap-1">
              <span>Hanexis</span>
              <span className="text-zinc-300 font-mono text-[10px] font-bold px-1.5 py-0.2 bg-zinc-900 rounded-sm border border-zinc-800">
                PRO_NODE
              </span>
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase mt-0.5">LEAD GEN MATRIX</p>
          </div>
        </div>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-3 font-semibold">Active Modules</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs tracking-wide transition-all group relative border ${
                isActive 
                  ? "bg-zinc-900 border-zinc-800 border-l-white border-l-2 text-white font-semibold" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                }`} />
                <span className="uppercase tracking-wider text-[11px]">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-zinc-800 text-white rounded-sm border border-zinc-700">
                  {item.badge}
                </span>
              )}

              {item.highlight && !isActive && (
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse absolute right-3"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resource Quota Widget (Geometric Theme requirement) */}
      <div className="px-5 py-4 border-t border-zinc-900 bg-zinc-950">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-sm p-3.5 mb-4">
          <p className="text-[9px] text-zinc-300 uppercase font-mono font-bold mb-1.5 tracking-wider">Campaign Credits Quota</p>
          <div className="h-1 bg-zinc-950 rounded-sm overflow-hidden">
            <div className="h-full bg-zinc-400 w-[68%]"></div>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-2">
            <span>6,842 / 10,000 Targets</span>
            <span className="text-zinc-400">68% USED</span>
          </div>
        </div>

        {/* User Badge */}
        <div className="flex items-center justify-between p-2 rounded-sm bg-zinc-900/50 border border-zinc-900">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                alt="Representative Profile"
                className="w-7 h-7 rounded-sm object-cover border border-zinc-800"
              />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider max-w-[100px] truncate leading-tight">
                Hari Prabu
              </h4>
              <p className="text-[9px] font-mono text-zinc-500 leading-none truncate max-w-[100px]">
                OWNER_NODE
              </p>
            </div>
          </div>
          <button 
            title="System Logout (Simulation)"
            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-sm transition-colors duration-150"
            onClick={() => alert("Simulation Signout: Clearing cached credentials...")}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
