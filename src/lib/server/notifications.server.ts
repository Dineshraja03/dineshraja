import { createServerFn } from "@tanstack/start";
import { supabase } from "@/integrations/supabase/client.server";

// Server function to send push notifications to all admins
export const sendPushNotificationsToAdmins = createServerFn({ method: "POST" })(
  async (messageData: { id: string; name: string; email: string; message: string; mode: "creator" | "developer" }) => {
    try {
      // Get all admin users with push subscriptions
      const { data: adminSubscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("*, user_id")
        .in("user_id", [
          // Get admin users
          supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin"),
        ]);

      if (subsError) {
        console.error("Error fetching subscriptions:", subsError);
        return { success: false, error: subsError.message };
      }

      if (!adminSubscriptions || adminSubscriptions.length === 0) {
        console.log("No admin subscriptions found");
        return { success: true, sent: 0 };
      }

      // Get VAPID keys from environment
      const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VITE_VAPID_PRIVATE_KEY;

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.log("VAPID keys not configured");
        return { success: false, error: "VAPID keys not configured" };
      }

      const notifications = [];
      const payload = JSON.stringify({
        title: `New message from ${messageData.name}`,
        body: messageData.message.substring(0, 100) + (messageData.message.length > 100 ? "..." : ""),
        url: "/admin/messages",
        messageId: messageData.id,
      });

      // Send notifications to each subscription
      for (const subscription of adminSubscriptions) {
        try {
          const result = await sendWebPushNotification(
            subscription.endpoint,
            subscription.auth_key,
            subscription.p256dh_key,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          // Log the notification
          const { error: logError } = await supabase.from("push_notifications_log").insert({
            user_id: subscription.user_id,
            message_id: messageData.id,
            success: result.success,
            error: result.error,
          });

          if (logError) {
            console.error("Error logging notification:", logError);
          }

          notifications.push({ userId: subscription.user_id, success: result.success });
        } catch (err) {
          console.error("Error sending notification:", err);
          const { error: logError } = await supabase.from("push_notifications_log").insert({
            user_id: subscription.user_id,
            message_id: messageData.id,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return { success: true, sent: notifications.filter((n) => n.success).length };
    } catch (err) {
      console.error("Server error sending notifications:", err);
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
);

// Web Push Protocol helper function
async function sendWebPushNotification(
  endpoint: string,
  authKey: string,
  p256dhKey: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For production, you'd implement the Web Push Protocol here
    // This involves:
    // 1. Creating a JWT signed with VAPID keys
    // 2. Encrypting the payload using the subscription keys
    // 3. Sending an HTTP POST request to the endpoint with specific headers

    // For now, this is a placeholder. In production, use a library like:
    // - web-push (Node.js)
    // - For Cloudflare Workers, implement the protocol directly

    console.log("Push notification would be sent to:", endpoint);
    
    // Return success for now - in production, this would actually send
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
