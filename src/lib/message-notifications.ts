import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./use-admin";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook to set up real-time message notifications for admin users
 * Shows both browser notifications and updates the messages list in real-time
 */
export function useMessageNotifications() {
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to new messages using Supabase real-time
    const channel = supabase
      .channel("contact_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_messages",
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Show browser notification if permission is granted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`New message from ${newMessage.name}`, {
              body: newMessage.message.substring(0, 100) + (newMessage.message.length > 100 ? "..." : ""),
              icon: "/logo.svg",
              tag: "new-message",
              requireInteraction: true,
            });
          }

          // Invalidate messages query to refresh the list
          qc.invalidateQueries({ queryKey: ["admin", "messages"] });
          
          // Also invalidate dashboard stats
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin, qc]);
}

/**
 * Alternative: Server-sent events for real-time notifications
 * Can be used if Supabase real-time is not suitable
 */
export function useSSENotifications() {
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;

    // This would connect to a server-sent event endpoint
    // Example: const eventSource = new EventSource('/api/notifications/stream');
    // eventSource.onmessage = (event) => { ... }

    // For now, this is a placeholder for future implementation
  }, [isAdmin, qc]);
}

/**
 * Send push notification through Web Push API
 * This works with the service worker at /public/sw.js
 */
export async function sendPushNotification(
  title: string,
  options?: NotificationOptions
) {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      icon: "/logo.svg",
      badge: "/logo.svg",
      ...options,
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}
