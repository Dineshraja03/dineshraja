import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [s, i, t] = await Promise.all([
        supabase.from("sections").select("id", { count: "exact", head: true }),
        supabase.from("section_items").select("id", { count: "exact", head: true }),
        supabase.from("testimonials").select("id", { count: "exact", head: true }),
      ]);
      return { sections: s.count ?? 0, items: i.count ?? 0, testimonials: t.count ?? 0 };
    },
  });
  const stats = [
    { label: "Sections", value: data?.sections ?? "—", to: "/admin/sections" },
    { label: "Content items", value: data?.items ?? "—", to: "/admin/items" },
    { label: "Testimonials", value: data?.testimonials ?? "—", to: "/admin/testimonials" },
  ];
  return (
    <div>
      <h1 className="font-heading text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back. Manage both modes of your site from here.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-lg border border-border bg-card p-5 transition hover:border-accent">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-heading text-3xl">{s.value}</div>
          </Link>
        ))}
      </div>
      <div className="mt-10 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
        Tip: your public site reflects changes immediately. Open <a className="underline" href="/" target="_blank" rel="noreferrer">/</a> in a new tab.
      </div>
    </div>
  );
}