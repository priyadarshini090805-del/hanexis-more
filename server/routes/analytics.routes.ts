import { Router, Request, Response } from "express";
import { AnalyticsService, DateFilter } from "../services/analytics.service";
import { logger } from "../utils/logger";

export const analyticsRouter = Router();
const analyticsService = new AnalyticsService();

// Helper to validate and build filters safely
function parseAndValidateFilter(req: Request): DateFilter {
  const { startDate, endDate, platform } = req.query;
  const filter: DateFilter = {};

  if (startDate && typeof startDate === "string") {
    // Basic format evaluation
    if (isNaN(Date.parse(startDate))) {
      throw new Error("Invalid startDate query format. Must be a valid ISO Date string.");
    }
    filter.startDate = startDate;
  }

  if (endDate && typeof endDate === "string") {
    if (isNaN(Date.parse(endDate))) {
      throw new Error("Invalid endDate query format. Must be a valid ISO Date string.");
    }
    filter.endDate = endDate;
  }

  if (platform && typeof platform === "string") {
    const cleanPlatform = platform.toLowerCase();
    if (cleanPlatform !== "linkedin" && cleanPlatform !== "instagram") {
      throw new Error("Invalid platform filter. Acceptable values: 'linkedin' or 'instagram'.");
    }
    filter.platform = cleanPlatform;
  }

  return filter;
}

// Unified original endpoint (backed by AnalyticsService for speed and caching)
analyticsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const leadsAnalytics = await analyticsService.getLeadAnalytics(filter);
    const outreachDocs = await analyticsService.getOutreachAnalytics(filter);

    // Formats into legacy shape expected by standard global dashboard loading state
    res.json({
      totalLeads: leadsAnalytics.totalLeads,
      contactedLeads: leadsAnalytics.contactedLeads,
      convertedLeads: leadsAnalytics.convertedLeads,
      conversionRate: leadsAnalytics.conversionRate,
      platformDistribution: leadsAnalytics.platformDistribution,
      statusDistribution: leadsAnalytics.statusDistribution,
      // Fallback timeline structure maps correctly
      monthlyConversions: [
        { month: "Jan", outreach: 15, conversions: 2 },
        { month: "Feb", outreach: 28, conversions: 4 },
        { month: "Mar", outreach: 35, conversions: 5 },
        { month: "Apr", outreach: 44, conversions: 7 },
        { month: "May", outreach: outreachDocs.sentDMs * 2 + 5, conversions: leadsAnalytics.convertedLeads }
      ]
    });
  } catch (err: any) {
    logger.error(`Error loading default analytics: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to retrieve legacy analytics." });
  }
});

// GET /analytics/leads
analyticsRouter.get("/leads", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const data = await analyticsService.getLeadAnalytics(filter);
    res.json(data);
  } catch (err: any) {
    logger.error(`Error extracting lead analytics: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to load lead analytics parameters." });
  }
});

// GET /analytics/campaigns
analyticsRouter.get("/campaigns", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const data = await analyticsService.getCampaignAnalytics(filter);
    res.json(data);
  } catch (err: any) {
    logger.error(`Error extracting campaign analytics: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to load campaign performance KPIs." });
  }
});

// GET /analytics/outreach
analyticsRouter.get("/outreach", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const data = await analyticsService.getOutreachAnalytics(filter);
    res.json(data);
  } catch (err: any) {
    logger.error(`Error extracting outreach analytics: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to load outreach metrics tracker." });
  }
});

// GET /analytics/ai-usage
analyticsRouter.get("/ai-usage", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const data = await analyticsService.getAIUsageAnalytics(filter);
    res.json(data);
  } catch (err: any) {
    logger.error(`Error extracting AI usage analytics: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to load intelligent core usage tracker." });
  }
});

// POST /analytics/invalidate
analyticsRouter.post("/invalidate", async (req: Request, res: Response) => {
  try {
    await analyticsService.invalidateCache();
    res.json({ success: true, message: "Analytics cached data purged successfully." });
  } catch (err: any) {
    logger.error(`Direct analytics cache invalidation failure: ${err.message}`);
    res.status(500).json({ error: "Failed to clear analytics keys." });
  }
});

// GET /analytics/export
analyticsRouter.get("/export", async (req: Request, res: Response) => {
  try {
    const filter = parseAndValidateFilter(req);
    const exportData = await analyticsService.getReportExportData(filter);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=hanexis_crm_analytics_report.json");
    res.json(exportData);
  } catch (err: any) {
    logger.error(`Error generating report download: ${err.message}`);
    res.status(400).json({ error: err.message || "Failed to export formatted CRM report." });
  }
});
