import { ref, computed } from "vue";
import apiClient from "@/lib/utils/apiClient";

const isSupported = ref(false);
const permission = ref<NotificationPermission>("default");
const isSubscribed = ref(false);
const isLoading = ref(false);

// Vérifier le support au chargement
if (typeof window !== "undefined") {
  isSupported.value = "serviceWorker" in navigator && "PushManager" in window;
  if ("Notification" in window) {
    permission.value = Notification.permission;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const canSubscribe = computed(
    () => isSupported.value && permission.value !== "denied"
  );

  async function checkSubscriptionStatus(): Promise<void> {
    if (!isSupported.value) return;

    try {
      const result = await apiClient.get<{ subscribed: boolean }>("/push/status");
      if (result.data) {
        isSubscribed.value = result.data.subscribed;
      }
    } catch {
      // Ignore errors
    }
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) {
      console.error("Push notifications not supported");
      return false;
    }

    isLoading.value = true;

    try {
      // Demander la permission
      const perm = await Notification.requestPermission();
      permission.value = perm;

      if (perm !== "granted") {
        console.log("Notification permission denied");
        isLoading.value = false;
        return false;
      }

      // Enregistrer le Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Récupérer la clé publique VAPID
      const keyResult = await apiClient.get<{ publicKey: string }>(
        "/push/vapid-public-key"
      );
      if (!keyResult.data?.publicKey) {
        console.error("Failed to get VAPID public key");
        isLoading.value = false;
        return false;
      }

      const applicationServerKey = urlBase64ToUint8Array(keyResult.data.publicKey);

      // S'abonner aux push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subscriptionJSON = subscription.toJSON();

      // Envoyer la subscription au backend
      const result = await apiClient.post("/push/subscribe", {
        endpoint: subscriptionJSON.endpoint,
        keys: subscriptionJSON.keys,
      });

      if (!result.error) {
        isSubscribed.value = true;
        isLoading.value = false;
        return true;
      }

      isLoading.value = false;
      return false;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      isLoading.value = false;
      return false;
    }
  }

  async function unsubscribe(): Promise<boolean> {
    if (!isSupported.value) return false;

    isLoading.value = true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Se désabonner côté navigateur
        await subscription.unsubscribe();

        // Se désabonner côté backend
        await apiClient.delete("/push/unsubscribe", {
          data: { endpoint: subscription.endpoint },
        });
      }

      isSubscribed.value = false;
      isLoading.value = false;
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      isLoading.value = false;
      return false;
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    canSubscribe,
    checkSubscriptionStatus,
    subscribe,
    unsubscribe,
  };
}
