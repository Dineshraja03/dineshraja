import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Admin" }, { name: "robots", content: "noindex" }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created. If confirmation is required, check email; otherwise you're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handle} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← back to site</Link>
        <h1 className="mt-3 font-heading text-2xl">Admin {mode === "signup" ? "sign up" : "sign in"}</h1>
        <p className="mt-1 font-body text-sm text-muted-foreground">Manage your portfolio content.</p>
        <label className="mt-6 block text-xs font-body text-muted-foreground">Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
        </label>
        <label className="mt-4 block text-xs font-body text-muted-foreground">Password
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
        </label>
        <button disabled={loading} type="submit"
          className="mt-6 w-full rounded-md bg-accent px-4 py-2.5 font-heading text-sm text-accent-foreground disabled:opacity-60">
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "signup" ? "Already have an account? Sign in" : "First admin? Create an account"}
        </button>
      </form>
    </div>
  );
}