import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Mail, 
  UserPlus, 
  MessageSquare, 
  Briefcase, 
  X, 
  Upload, 
  Check,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Lead, OutreachActivity } from "../types";

interface LeadsViewProps {
  leads: Lead[];
  activities: OutreachActivity[];
  onAddLead: (lead: Partial<Lead>) => void;
  onUpdateLeadStatus: (id: string, status: any) => void;
  onDeleteLead: (id: string) => void;
  onSelectLeadForAI: (lead: Lead) => void;
}

export default function LeadsView({ 
  leads, 
  activities,
  onAddLead, 
  onUpdateLeadStatus, 
  onDeleteLead, 
  onSelectLeadForAI 
}: LeadsViewProps) {
  
  // States
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "linkedin" | "instagram">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Selected Lead state for sidebar profile detail visualizer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);

  // Form states for adding leads manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formHandle, setFormHandle] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPlatform, setFormPlatform] = useState<"linkedin" | "instagram">("linkedin");
  const [formBio, setFormBio] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");

  // Handler for adding a lead
  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formTitle || !formCompany || !formHandle) {
      alert("Please fill in Name, Title, Company and Social handle.");
      return;
    }

    const parsedTags = formTags ? formTags.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    onAddLead({
      name: formName,
      title: formTitle,
      company: formCompany,
      platform: formPlatform,
      handle: formHandle,
      email: formEmail,
      bio: formBio,
      notes: formNotes,
      tags: parsedTags
    });

    // Reset and close
    setFormName("");
    setFormTitle("");
    setFormCompany("");
    setFormHandle("");
    setFormEmail("");
    setFormBio("");
    setFormNotes("");
    setFormTags("");
    setShowAddForm(false);
  };

  // Import quick seed mock leads
  const handleBulkInsertMock = () => {
    const mockLead = {
      name: "Olivia Thorne",
      title: "Co-Founder & Web3 Strategist",
      company: "DecentralStudio",
      platform: "linkedin" as const,
      handle: "olivia-thorne-decent",
      email: "olivia@decentral.io",
      bio: "Focusing on decentralized finance UX frameworks and scalability pitches.",
      notes: "High priority lead. Met at Tech Summit.",
      tags: ["Web3", "SaaS Builder", "Decision Maker"]
    };
    onAddLead(mockLead);
  };

  // Filter leads list
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.title.toLowerCase().includes(search.toLowerCase()) ||
      lead.handle.toLowerCase().includes(search.toLowerCase());
      
    const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'new': 
        return 'bg-zinc-850 text-zinc-300 border-zinc-705';
      case 'contacted': 
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'nurturing': 
        return 'bg-amber-950/40 text-amber-300 border-amber-800/30';
      case 'converted': 
        return 'bg-white text-zinc-950 border-white font-bold';
      case 'disqualified': 
        return 'bg-rose-950/40 text-rose-300 border-rose-800/30';
      default: 
        return 'bg-zinc-900 text-zinc-500 border-zinc-800';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in align-top">
      {/* Left side column: Leads Grid & Filters */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Header toolbar Controls */}
        <div className="bg-zinc-950 border border-zinc-905 rounded-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">Leads Hub Matrix</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">Acquire, coordinate, and orchestrate custom interactions with social targets.</p>
            </div>
            
            <div className="flex items-center space-x-2.5 font-mono">
              <button
                onClick={() => handleBulkInsertMock()}
                className="px-3.5 py-2 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 rounded-sm transition-all flex items-center space-x-1.5 uppercase"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Seed Mock Lead</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 text-[10px] font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-sm transition-all flex items-center space-x-1.5 uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target Profile</span>
              </button>
            </div>
          </div>

          {/* Search column and segment filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-4 h-4 text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder="Search leads by name, title, company, or handles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-300 text-xs rounded-sm pl-10 pr-4 py-3 transition-all text-zinc-100 placeholder-zinc-500 outline-none uppercase font-mono"
              />
            </div>

            <div className="flex gap-2">
              {/* Platform Selector */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 focus:border-zinc-300 text-xs rounded-sm px-3 py-2.5 outline-none font-bold uppercase font-mono text-zinc-300"
              >
                <option value="all">Channels: All</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
              </select>

              {/* Status Selector */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 focus:border-zinc-300 text-xs rounded-sm px-3 py-2.5 outline-none font-bold uppercase font-mono text-zinc-300"
              >
                <option value="all">Status: All</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="nurturing">Nurturing</option>
                <option value="converted">Converted</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lead profile items scroll scroll */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-12 text-center text-zinc-500 font-mono">
              <Search className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
              <h4 className="text-white font-bold uppercase text-xs">No matching leads located</h4>
              <p className="text-[10px] text-zinc-650 mt-1 uppercase">Modify your query tags or seed a simulated profile with one tap.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-4 bg-zinc-950 border rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
                  selectedLead?.id === lead.id 
                    ? "border-white bg-zinc-900/40 shadow-sm" 
                    : "border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10"
                }`}
              >
                {/* Profile Core Meta */}
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-sm object-cover border border-zinc-900"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-sm flex items-center justify-center border border-zinc-950 ${
                      lead.platform === 'linkedin' ? 'bg-zinc-900' : 'bg-zinc-900'
                    }`}>
                    {lead.platform === 'linkedin' ? (
                      <span className="text-[10px] font-bold text-zinc-300 font-sans">in</span>
                    ) : (
                      <span className="text-[9px] text-pink-405 font-bold">ig</span>
                    )}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-sans font-bold text-white tracking-wide">
                        {lead.name}
                      </h4>
                      <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-sm border ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    <p className="text-xs text-zinc-400 font-sans mt-0.5 flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                      {lead.title} at <strong className="text-zinc-200 font-bold ml-1">{lead.company}</strong>
                    </p>
                    
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {lead.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-900 text-zinc-502 rounded-sm border border-zinc-850 uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right utility buttons: Action Launcher and trigger */}
                <div className="flex items-center space-x-2 self-end sm:self-auto font-mono text-[10px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLeadForAI(lead);
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-sm border border-zinc-300 transition-all flex items-center space-x-1 uppercase"
                  >
                    <span>Write AI Pitch</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLead(lead.id);
                      if (selectedLead?.id === lead.id) {
                        setSelectedLead(null);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-sm transition-colors border border-transparent hover:border-zinc-800/20"
                    title="Remove Prospect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* Right side column: Detailed Lead Profile Slide-in / Viewer */}
      <div className="xl:col-span-1">
        {selectedLead ? (
          <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-6 space-y-6 sticky top-6">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-mono text-zinc-200 uppercase tracking-widest bg-zinc-900 px-2.5 py-1 rounded-sm border border-zinc-800 font-bold">
                Detailed Profiler
              </span>
              <div className="flex items-center space-x-1 text-[10px] text-zinc-500 font-mono uppercase">
                <span>PORT: {selectedLead.id}</span>
              </div>
            </div>

            {/* Core Card Section */}
            <div className="text-center pb-6 border-b border-zinc-900">
              <img
                src={selectedLead.avatar}
                alt={selectedLead.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-sm object-cover mx-auto border border-zinc-900 shadow-md mb-3"
              />
              <h3 className="text-sm font-bold text-white leading-normal uppercase tracking-wide">{selectedLead.name}</h3>
              <p className="text-xs text-zinc-400 font-sans mt-1 uppercase">
                {selectedLead.title}
              </p>
              <p className="text-xs text-zinc-300 font-bold font-mono mt-0.5 uppercase">
                [{selectedLead.company}]
              </p>

              {/* Status Mutator Selector */}
              <div className="mt-4 flex items-center justify-center space-x-2 font-mono text-[11px]">
                <span className="text-[10px] text-zinc-500 uppercase font-medium">Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    onUpdateLeadStatus(selectedLead.id, newStatus);
                    setSelectedLead({ ...selectedLead, status: newStatus });
                  }}
                  className="bg-zinc-900 border border-zinc-805 text-[10px] rounded-sm px-2.5 py-1.5 focus:border-zinc-355 text-zinc-200 outline-none uppercase font-mono font-bold"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="nurturing">Nurturing</option>
                  <option value="converted">✔ Converted</option>
                  <option value="disqualified">Disqualified</option>
                </select>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="space-y-4 text-sm font-mono text-xs">
              <div>
                <span className="text-[10px] font-mono text-zinc-505 uppercase tracking-wider block">Bio Description Matrix</span>
                <p className="text-zinc-300 mt-1 leading-relaxed italic font-sans text-xs">
                  "{selectedLead.bio || 'No profile bio imported yet'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Handle / ID</span>
                  <span className="text-xs text-zinc-200 font-mono mt-0.5 flex items-center">
                    <ExternalLink className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                    {selectedLead.handle}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Direct Email</span>
                  <span className="text-xs text-zinc-200 mt-0.5 flex items-center max-w-[120px] truncate">
                    <Mail className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                    {selectedLead.email || 'None on record'}
                  </span>
                </div>
              </div>

              {/* Private Analyst Notes */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Internal Analyst Private Notes</span>
                <p className="text-zinc-300 text-xs mt-1 leading-relaxed bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-905">
                  {selectedLead.notes || 'No private records logged yet.'}
                </p>
              </div>

              {/* Logged Timeline Outreach logs */}
              <div className="pt-4 border-t border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 font-bold">Campaign Outreach Logs</span>
                <div className="space-y-2.5">
                  {activities.filter(a => a.leadId === selectedLead.id).length === 0 ? (
                    <p className="text-xs text-zinc-500 justify-center flex items-center italic py-2">
                      No outreach steps logged yet.
                    </p>
                  ) : (
                    activities
                      .filter(a => a.leadId === selectedLead.id)
                      .map((act) => (
                        <div key={act.id} className="p-2.5 bg-zinc-900/60 rounded-sm border border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded-sm border border-zinc-850">
                              {act.type}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">
                              {act.sentDate ? new Date(act.sentDate).toLocaleDateString() : 'Draft'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1.5 italic font-medium leading-normal bg-zinc-950 p-2 rounded-sm font-sans">
                            "{act.content}"
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Launch Outbound Trigger */}
              <button
                onClick={() => onSelectLeadForAI(selectedLead)}
                className="w-full py-3.5 text-[10px] font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-sm transition-all text-center uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Compile Dynamic copy string</span>
              </button>

            </div>

          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-8 text-center text-zinc-500 font-mono">
            <HelpCircle className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
            <p className="text-xs uppercase">Select target profile from matrix</p>
          </div>
        )}
      </div>

      {/* Slide-out / Modal Overlay for creating Lead manually */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-800">
              <UserPlus className="w-6 h-6 text-zinc-200" />
              <div>
                <h3 className="text-lg font-display font-bold text-white">Acquire Social Target Profile</h3>
                <p className="text-xs text-zinc-400">Add LinkedIn or Instagram lead parameters manually to target them with AI.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Lead Name*</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. Elon Musk"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Target Account Platform*</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-zinc-300 outline-none"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Job Title*</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="E.g. Tech Lead / Founder"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Company*</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="E.g. OpenAI / Tesla"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Social Handle/ID*</label>
                  <input
                    type="text"
                    required
                    value={formHandle}
                    onChange={(e) => setFormHandle(e.target.value)}
                    placeholder="E.g. elonmusk-pro"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="E.g. hello@openai.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Short Bio/Description</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="E.g. Scaling neural compilers and AI robotics..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Custom Tags (Comma Sep)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="SaaS, Investor, Dec-Maker"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Internal Target Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Met at tech conference last night"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-355 focus:ring-1 focus:ring-zinc-355 text-sm rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Save Lead to Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
