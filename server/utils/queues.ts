import { ResilientQueue } from "./queue";

// Centralized Core Queues with type parameters representing workflows
export const campaignQueue = new ResilientQueue<{ campaignId: string; action: string; payload?: any }>("campaign-automation");
export const contentQueue = new ResilientQueue<{ postId: string; platform: string }>("content-scheduling");
export const outreachQueue = new ResilientQueue<{ activityId: string; leadId: string }>("outreach-dispatch");
export const integrationQueue = new ResilientQueue<{ platform: string; action: string; integrationId: string }>("integration-sync");
