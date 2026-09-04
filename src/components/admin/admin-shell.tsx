import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, LayoutList, MessageSquareQuote, Settings, LogOut, ExternalLink, Inbox, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/lib/use-admin";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/sections", label: "Sections", icon: LayoutList },
  { to: "/admin/items", label: "Content items", icon: LayoutList },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Site settings", icon: Settings },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();

  const isActive = (to: string) => path === to || (to !== "/admin" && path.startsWith(to));

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground" data-mode="creator">
      <aside className="hidden w-60 flex-col border-r border-border bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-6 block font-heading text-lg">Portfolio CMS</Link>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${isActive(n.to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-xs">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </a>
          <button onClick={signOut} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-4 backdrop-blur md:hidden">
          <Link to="/" className="font-heading text-base">Portfolio CMS</Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link to="/admin/notifications" aria-label="Notifications"><Bell className="h-5 w-5" /></Link>
            <Link to="/admin/settings" aria-label="Site settings"><Settings className="h-5 w-5" /></Link>
            <a href="/" target="_blank" rel="noreferrer" aria-label="View site"><ExternalLink className="h-5 w-5" /></a>
            <button onClick={signOut} aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-4 pb-24 md:p-10 md:pb-10">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Checking permissions…</p>
          ) : !isAdmin ? (
            <NotAdmin />
          ) : children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-between border-t border-border bg-background/95 backdrop-blur md:hidden">
        {nav.filter((n) => n.to !== "/admin/notifications" && n.to !== "/admin/settings").map((n) => (
          <Link key={n.to} to={n.to}
            className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] leading-tight transition ${isActive(n.to) ? "text-accent" : "text-muted-foreground"}`}>
            <n.icon className="h-4 w-4" />
            <span className="truncate">{n.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NotAdmin() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h1 className="font-heading text-xl">You're signed in, but not an admin.</h1>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        Ask an existing admin to grant your account the <code className="rounded bg-muted px-1">admin</code> role.
      </p>
    </div>
  );
}
