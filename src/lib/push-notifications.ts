import { supabase } from "@/integrations/supabase/client";

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered", registration);
    return registration;
  } catch (err) {
    console.error("Service Worker registration failed:", err);
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return null;
  }

  if (Notification.permission === "denied") {
    console.log("Notification permission denied");
    return null;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Note: You'll need a VAPID key pair for push notifications
    // Generate one at https://tools.reactpwa.com/vapid
    // Set it in your env: VITE_VAPID_PUBLIC_KEY
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.log("VAPID public key not configured");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Save subscription to database
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        auth_key: arrayBufferToBase64(subscription.getKey("auth")),
        p256dh_key: arrayBufferToBase64(subscription.getKey("p256dh")),
      });

      if (error) {
        console.error("Failed to save subscription:", error);
      } else {
        console.log("Push subscription saved");
      }
    }

    return subscription;
  } catch (err) {
    console.error("Failed to subscribe to push notifications:", err);
    return null;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", session.user.id)
          .eq("endpoint", subscription.endpoint);
      }

      await subscription.unsubscribe();
      console.log("Unsubscribed from push notifications");
    }
  } catch (err) {
    console.error("Failed to unsubscribe from push notifications:", err);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
