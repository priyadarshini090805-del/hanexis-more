import { Lead, OutreachActivity, ScheduledPost, Conversation, AnalyticsSummary } from "../types";

export async function getLeads(): Promise<Lead[]> {
  const res = await fetch("/api/leads");
  if (!res.ok) throw new Error("Failed to load leads");
  return res.json();
}

export async function createLead(lead: Partial<Lead>): Promise<Lead> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json();
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json();
}

export async function deleteLead(id: string): Promise<boolean> {
  const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete lead");
  return true;
}

export async function getOutreachActivities(): Promise<OutreachActivity[]> {
  const res = await fetch("/api/outreach");
  if (!res.ok) throw new Error("Failed to load outreach history");
  return res.json();
}

export async function createOutreachActivity(activity: Partial<OutreachActivity>): Promise<OutreachActivity> {
  const res = await fetch("/api/outreach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activity)
  });
  if (!res.ok) throw new Error("Failed to log activity");
  return res.json();
}

export async function updateOutreachStatus(id: string, status: 'draft' | 'pending_approval' | 'approved' | 'sent'): Promise<OutreachActivity> {
  const res = await fetch(`/api/outreach/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("Failed to update outreach state");
  return res.json();
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const res = await fetch("/api/posts");
  if (!res.ok) throw new Error("Failed to load posts");
  return res.json();
}

export async function createScheduledPost(post: Partial<ScheduledPost>): Promise<ScheduledPost> {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post)
  });
  if (!res.ok) throw new Error("Failed to schedule post");
  return res.json();
}

export async function updateScheduledPost(id: string, updates: Partial<ScheduledPost>): Promise<ScheduledPost> {
  const res = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to update post content");
  return res.json();
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error("Failed to load threads");
  return res.json();
}

export async function sendChatMessage(convId: string, sender: 'lead' | 'user', text: string): Promise<Conversation> {
  const res = await fetch(`/api/conversations/${convId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, text })
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function getIntegrations() {
  const res = await fetch("/api/integrations");
  if (!res.ok) throw new Error("Failed to fetch integrations");
  return res.json();
}

export async function toggleIntegration(platform: 'linkedin' | 'instagram', username?: string) {
  const res = await fetch("/api/integrations/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, username })
  });
  if (!res.ok) throw new Error("Failed to update integration state");
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to load analytics summarize");
  return res.json();
}

export async function getAnalyticsLeads(filters?: { startDate?: string; endDate?: string; platform?: string }) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

  const res = await fetch(`/api/analytics/leads?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load detailed lead analytics");
  return res.json();
}

export async function getAnalyticsCampaigns(filters?: { startDate?: string; endDate?: string; platform?: string }) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

  const res = await fetch(`/api/analytics/campaigns?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load detailed campaign analytics");
  return res.json();
}

export async function getAnalyticsOutreach(filters?: { startDate?: string; endDate?: string; platform?: string }) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

  const res = await fetch(`/api/analytics/outreach?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load detailed outreach analytics");
  return res.json();
}

export async function getAnalyticsAIUsage(filters?: { startDate?: string; endDate?: string; platform?: string }) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

  const res = await fetch(`/api/analytics/ai-usage?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load detailed AI usage analytics");
  return res.json();
}

export async function exportAnalyticsReport(filters?: { startDate?: string; endDate?: string; platform?: string }): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

  const res = await fetch(`/api/analytics/export?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to export analytics report");
  return res.blob();
}

// AI Engine triggers
export async function generateAIMessage(params: {
  name: string;
  title: string;
  company: string;
  bio: string;
  notes?: string;
  platform: 'linkedin' | 'instagram';
  type: 'connection' | 'follow_up' | 'sales_pitch';
  tone: string;
  instructions?: string;
}): Promise<{ text: string; sim?: boolean }> {
  const res = await fetch("/api/ai/generate-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to run AI generation");
  return res.json();
}

export async function generateAIContent(params: {
  topic: string;
  platform: 'linkedin' | 'instagram';
  format: 'Regular Post' | 'Video Script' | 'Job Post';
  audience: string;
  keyPoints?: string;
}): Promise<{ text: string; sim?: boolean }> {
  const res = await fetch("/api/ai/generate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to run AI content strategist");
  return res.json();
}

export async function suggestReplies(params: {
  thread: { sender: 'lead' | 'user'; text: string }[];
  platform: 'linkedin' | 'instagram';
}): Promise<{ suggestions: { tone: string; text: string }[]; sim?: boolean }> {
  const res = await fetch("/api/ai/suggest-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to run AI message assistant suggestions");
  return res.json();
}
