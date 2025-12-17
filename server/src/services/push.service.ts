import webpush from "web-push";
import pg from "../config/db.config";
import { PushSubscription } from "../config/entities/PushSubscription";
import { Vote } from "../config/entities/Vote";
import { Item } from "../config/entities/Item";
import { LessThan, IsNull, Not } from "typeorm";

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

// Configure web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@everything-tierlist.fr",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
} else {
  console.warn("VAPID keys not configured. Push notifications disabled.");
}

const DEBOUNCE_HOURS = 1;

export async function notifyUsersWithPendingItems(): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return;
  }

  const subscriptionRepo = pg.getRepository(PushSubscription);
  const voteRepo = pg.getRepository(Vote);
  const itemRepo = pg.getRepository(Item);

  const oneHourAgo = new Date(Date.now() - DEBOUNCE_HOURS * 60 * 60 * 1000);

  // Récupérer toutes les subscriptions qui n'ont pas été notifiées depuis 1h
  const subscriptions = await subscriptionRepo.find({
    where: [
      { lastNotifiedAt: IsNull() },
      { lastNotifiedAt: LessThan(oneHourAgo) },
    ],
  });

  // Nombre total d'items
  const totalItems = await itemRepo.count();

  for (const subscription of subscriptions) {
    try {
      // Compter les votes de cet utilisateur (hors IGNORED)
      const userVotes = await voteRepo.count({
        where: {
          userId: subscription.userId,
          tier: Not("IGNORED"),
        },
      });

      // Si l'utilisateur a des items non triés
      const unvotedCount = totalItems - userVotes;

      if (unvotedCount > 0) {
        const payload = JSON.stringify({
          title: "Nouveaux items à trier !",
          body: `${unvotedCount} élément${unvotedCount > 1 ? "s" : ""} en attente de vote`,
          url: "/",
          icon: "/favicon.ico",
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload,
        );

        // Mettre à jour lastNotifiedAt
        subscription.lastNotifiedAt = new Date();
        await subscriptionRepo.save(subscription);

        console.log(`Push notification sent to user ${subscription.userId}`);
      }
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      // Si la subscription n'est plus valide (410 Gone), la supprimer
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(
          `Removing invalid subscription for user ${subscription.userId}`,
        );
        await subscriptionRepo.remove(subscription);
      } else {
        console.error(
          `Failed to send push to user ${subscription.userId}:`,
          error,
        );
      }
    }
  }
}

export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}
