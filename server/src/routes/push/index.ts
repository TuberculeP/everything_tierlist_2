import { Router } from "express";
import pg from "../../config/db.config";
import { PushSubscription } from "../../config/entities/PushSubscription";
import { getVapidPublicKey } from "../../services/push.service";

const pushRouter = Router();

// GET /api/push/vapid-public-key - Récupérer la clé publique VAPID
pushRouter.get("/vapid-public-key", (_req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey });
});

// POST /api/push/subscribe - S'abonner aux notifications
pushRouter.post("/subscribe", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription data" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const subscriptionRepo = pg.getRepository(PushSubscription);

  try {
    // Vérifier si cette subscription existe déjà
    let subscription = await subscriptionRepo.findOne({ where: { endpoint } });

    if (subscription) {
      // Mettre à jour si elle existe (peut-être un autre user ou keys changées)
      subscription.userId = userId;
      subscription.keys = keys;
    } else {
      // Créer une nouvelle subscription
      subscription = new PushSubscription();
      subscription.userId = userId;
      subscription.endpoint = endpoint;
      subscription.keys = keys;
    }

    await subscriptionRepo.save(subscription);

    res.json({ message: "Subscription saved successfully" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// DELETE /api/push/unsubscribe - Se désabonner des notifications
pushRouter.delete("/unsubscribe", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { endpoint } = req.body;

  if (!endpoint) {
    res.status(400).json({ error: "Endpoint required" });
    return;
  }

  const subscriptionRepo = pg.getRepository(PushSubscription);

  try {
    const subscription = await subscriptionRepo.findOne({ where: { endpoint } });

    if (subscription) {
      await subscriptionRepo.remove(subscription);
    }

    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

// GET /api/push/status - Vérifier si l'utilisateur est abonné
pushRouter.get("/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const subscriptionRepo = pg.getRepository(PushSubscription);

  try {
    const subscription = await subscriptionRepo.findOne({ where: { userId } });
    res.json({ subscribed: !!subscription });
  } catch (error) {
    console.error("Error checking push status:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

export default pushRouter;
