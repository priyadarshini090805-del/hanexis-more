import { Router, Request, Response } from "express";
import { Platform } from "@prisma/client";
import { IntegrationService } from "../services/integration.service";
import { integrationQueue } from "../utils/queues";
import { logger } from "../utils/logger";

export const integrationsRouter = Router();
const integrationService = new IntegrationService();

// GET /api/integrations - Fetch connected integrations in both simple & enriched structures
integrationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const list = await integrationService.listAllConnections();
    
    const linkedin = list.find(i => i.platform === "LINKEDIN");
    const instagram = list.find(i => i.platform === "INSTAGRAM");

    // Returns a consolidated structure that satisfies old and new clients
    res.json({
      linkedinJoined: linkedin?.isConnected ?? false,
      linkedinUsername: linkedin?.username ?? "",
      instagramJoined: instagram?.isConnected ?? false,
      instagramUsername: instagram?.username ?? "",
      connections: list // Enriched telemetry logs & details
    });
  } catch (err: any) {
    logger.error(`Error retrieving account connections: ${err.message}`);
    res.status(500).json({ error: "Failed listing registered account integrations." });
  }
});

// GET /api/integrations/oauth/url - Returns OAuth provider start url
integrationsRouter.get("/oauth/url", async (req: Request, res: Response) => {
  const { platform } = req.query;

  if (!platform || typeof platform !== "string") {
    return res.status(400).json({ error: "Platform parameter is mandated." });
  }

  const cleanPlat = platform.toUpperCase();
  if (cleanPlat !== "LINKEDIN" && cleanPlat !== "INSTAGRAM") {
    return res.status(400).json({ error: "Invalid platform value. Allowed: linkedin or instagram" });
  }

  try {
    const activePlat = cleanPlat as Platform;
    const adapter = integrationService.getProvider(activePlat);
    
    // Construct the redirect uri pointing back to the current server callback
    const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/oauth/callback`;
    const authUrl = adapter.getAuthUrl(redirectUri);
    
    logger.info(`Constructed OAuth Authorize URL for ${activePlat}: ${authUrl}`);
    res.json({ url: authUrl });
  } catch (err: any) {
    logger.error(`Error building OAuth URL: ${err.message}`);
    res.status(500).json({ error: "Could not assemble provider permission URL." });
  }
});

// GET /api/integrations/oauth/callback (and support alternate trailing slash router endpoints if needed)
const oauthCallbackHandler = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Authorization code is required from provider.");
  }

  try {
    // Detect platform from state or default parameters - or read state parameters
    // In our constructed AuthUrl, state starts with 'harnexis_'
    const isInstagramState = state && typeof state === "string" && state.includes("insta");
    const activePlat = isInstagramState ? Platform.INSTAGRAM : Platform.LINKEDIN;

    const adapter = integrationService.getProvider(activePlat);
    const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/oauth/callback`;

    // 1. Exchange OAuth code for actual token
    const tokenInfo = await adapter.exchangeCode(code, redirectUri);

    // 2. Link account inside database with encryption
    const record = await integrationService.linkIntegrationAccount(
      activePlat,
      tokenInfo.accessToken,
      tokenInfo.expiresAt,
      tokenInfo.username
    );

    // 3. Queue immediate profile and contacts synchronization job
    if (record) {
      await integrationQueue.addJob(
        `sync-leads-${activePlat}-${record.id}`,
        {
          platform: activePlat,
          action: "SYNC_PROFILE_AND_CONNECTIONS",
          integrationId: record.id
        }
      );
    }

    // 4. Return standard HTML layout sending postMessage callback as required by oauth-integration skill!
    res.send(`
      <html>
        <head>
          <title>Handshake successful</title>
          <style>
            body { background: #09090b; color: #fafafa; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; border: 1px solid #27272a; padding: 2rem; border-radius: 8px; background: #000; }
            h1 { color: #a855f7; font-size: 1.5rem; margin-bottom: 1rem; }
            p { color: #a1a1aa; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Handshake Connection Verified</h1>
            <p>Authentication was completed successfully. This window will now close.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${activePlat.toLowerCase()}' }, '*');
              setTimeout(() => {
                window.close();
              }, 1200);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);

  } catch (err: any) {
    logger.error(`OAuth Callback execution failed: ${err.message}`);
    res.status(500).send(`Authentication Handshake error: ${err.message}`);
  }
};

integrationsRouter.get("/oauth/callback", oauthCallbackHandler);
integrationsRouter.get("/oauth/callback/", oauthCallbackHandler);


// POST /api/integrations/toggle - Legacy handler supporting simple front-end toggle action switches
integrationsRouter.post("/toggle", async (req: Request, res: Response) => {
  const { platform, username } = req.body;

  if (!platform || typeof platform !== "string") {
    return res.status(400).json({ error: "Platform name is required parameters." });
  }

  const cleanPlat = platform.toUpperCase();
  if (cleanPlat !== "LINKEDIN" && cleanPlat !== "INSTAGRAM") {
    return res.status(400).json({ error: "Invalid platform target." });
  }

  try {
    const activePlat = cleanPlat as Platform;
    const list = await integrationService.listAllConnections();
    const existing = list.find(i => i.platform === activePlat);

    if (existing && existing.isConnected) {
      // Disconnect run
      await integrationService.disconnectAccount(activePlat);
    } else {
      // Direct instant connection using standard credential params
      const providerUser = username || (activePlat === Platform.LINKEDIN ? "hariprabu-business" : "hariprabu_insta");
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const record = await integrationService.linkIntegrationAccount(
        activePlat,
        `simulated_token_${activePlat}_${Date.now()}`,
        thirtyDays,
        providerUser
      );

      // Instantly dispatch leads synchronization workflow
      if (record) {
        await integrationQueue.addJob(
          `sync-leads-toggle-${activePlat}`,
          {
            platform: activePlat,
            action: "SYNC_PROFILE_AND_CONNECTIONS",
            integrationId: record.id
          }
        );
      }
    }

    // Return the updated connections state so old layouts don't break
    const updatedList = await integrationService.listAllConnections();
    const updatedLinkedin = updatedList.find(i => i.platform === "LINKEDIN");
    const updatedInstagram = updatedList.find(i => i.platform === "INSTAGRAM");

    res.json({
      linkedinJoined: updatedLinkedin?.isConnected ?? false,
      linkedinUsername: updatedLinkedin?.username ?? "",
      instagramJoined: updatedInstagram?.isConnected ?? false,
      instagramUsername: updatedInstagram?.username ?? "",
      connections: updatedList
    });

  } catch (err: any) {
    logger.error(`Legacy toggle failed: ${err.message}`);
    res.status(500).json({ error: "Handshake toggle error completed." });
  }
});

// POST /api/integrations/:platform/sync - Force/trigger manual synchronizations
integrationsRouter.post("/:platform/sync", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const cleanPlat = platform.toUpperCase();

  if (cleanPlat !== "LINKEDIN" && cleanPlat !== "INSTAGRAM") {
    return res.status(400).json({ error: "Incorrect platform parameters supplied." });
  }

  try {
    const activePlat = cleanPlat as Platform;
    const list = await integrationService.listAllConnections();
    const target = list.find(i => i.platform === activePlat);

    if (!target || !target.isConnected) {
      return res.status(400).json({ error: `Please connect ${platform} before triggering sync routines.` });
    }

    // Instantly queue high priority sync job
    await integrationQueue.addJob(
      `manual-sync-${activePlat}-${Date.now()}`,
      {
        platform: activePlat,
        action: "SYNC_PROFILE_AND_CONNECTIONS",
        integrationId: `manual-${activePlat}`
      }
    );

    res.json({ success: true, message: `Dispatched synchronization task for ${platform} in queues.` });
  } catch (err: any) {
    logger.error(`Sync initiation failure: ${err.message}`);
    res.status(500).json({ error: "Failed enqueuing synchronization task logs." });
  }
});

// POST /api/integrations/:platform/disconnect - RESTful disconnect channel endpoint
integrationsRouter.post("/:platform/disconnect", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const cleanPlat = platform.toUpperCase();

  if (cleanPlat !== "LINKEDIN" && cleanPlat !== "INSTAGRAM") {
    return res.status(400).json({ error: "Platform parameter invalid." });
  }

  try {
    await integrationService.disconnectAccount(cleanPlat as Platform);
    res.json({ success: true, message: `Account connections to ${platform} uncoupled.` });
  } catch (err: any) {
    logger.error(`Disconnect error: ${err.message}`);
    res.status(500).json({ error: "Could not safely divorce linked credentials." });
  }
});

// POST /api/integrations/webhook/:platform - Webhook callbacks receiver ingestion
integrationsRouter.post("/webhook/:platform", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const cleanPlat = platform.toUpperCase();

  if (cleanPlat !== "LINKEDIN" && cleanPlat !== "INSTAGRAM") {
    return res.status(400).json({ error: "Platform webhook path target unassigned." });
  }

  try {
    const acknowledged = await integrationService.processIncomingWebhook(cleanPlat as Platform, req.body);
    res.json({ acknowledged });
  } catch (err: any) {
    logger.error(`Webhook processing fault: ${err.message}`);
    res.status(500).json({ error: "Failed parsing webhook callback payload." });
  }
});
