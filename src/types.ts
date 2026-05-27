export interface Lead {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  company: string;
  platform: 'linkedin' | 'instagram';
  handle: string;
  email: string;
  status: 'new' | 'contacted' | 'nurturing' | 'converted' | 'disqualified';
  tags: string[];
  bio: string;
  notes: string;
  createdAt: string;
}

export interface OutreachActivity {
  id: string;
  leadId: string;
  leadName: string;
  type: 'connection' | 'follow_up' | 'sales_pitch' | 'general';
  content: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent';
  scheduledDate?: string;
  sentDate?: string;
  createdAt: string;
}

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: 'linkedin' | 'instagram';
  publishDate: string; // YYYY-MM-DD
  status: 'draft' | 'scheduled' | 'approved' | 'published';
  visualPrompt?: string;
  generatedImageImageUrl?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'lead' | 'user';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadAvatar?: string;
  leadHandle: string;
  platform: 'linkedin' | 'instagram';
  messages: ChatMessage[];
  unread: boolean;
  lastUpdated: string;
}

export interface AnalyticsSummary {
  totalLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  platformDistribution: { platform: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  monthlyConversions: { month: string; outreach: number; conversions: number }[];
}
