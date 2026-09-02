import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, BellOff, Check, Loader } from "lucide-react";
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from "@/lib/push-notifications";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["push-subscription", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (subscription) {
      setIsSubscribed(true);
    }
  }, [subscription]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await subscribeToPushNotifications();
      if (result) {
        toast.success("Notifications enabled! You'll receive alerts when someone messages you.");
        qc.invalidateQueries({ queryKey: ["push-subscription"] });
        setIsSubscribed(true);
      } else {
        toast.error("Failed to enable notifications. Please check browser permissions.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeFromPushNotifications();
      toast.success("Notifications disabled");
      qc.invalidateQueries({ queryKey: ["push-subscription"] });
      setIsSubscribed(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable notifications");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl">Notification Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage push notifications for new messages.</p>

      <div className="mt-8 max-w-2xl rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg">Push Notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get instant notifications when someone submits a contact message. You can manage this anytime.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                Receive alerts when new messages arrive
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                Works on Android with PWA installation
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                Only admin users receive notifications
              </li>
            </ul>
          </div>

          <div>
            {isSubscribed ? (
              <button
                onClick={handleUnsubscribe}
                disabled={isSubscribing}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-60"
              >
                {isSubscribing ? <Loader className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
                {isSubscribing ? "Disabling..." : "Disable"}
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-60"
              >
                {isSubscribing ? <Loader className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {isSubscribing ? "Enabling..." : "Enable"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-md border border-border/50 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Status:</strong> {isSubscribed ? "✓ Notifications enabled" : "• Notifications disabled"}
          </p>
          {!("serviceWorker" in navigator) && (
            <p className="mt-2 text-xs text-destructive">Service Workers are not supported in your browser.</p>
          )}
          {!("Notification" in window) && (
            <p className="mt-2 text-xs text-destructive">Notifications are not supported in your browser.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium">💡 Tip:</p>
        <p className="mt-1">Install this site as an app on Android to receive notifications even when the browser is closed.</p>
      </div>
    </div>
  );
}
