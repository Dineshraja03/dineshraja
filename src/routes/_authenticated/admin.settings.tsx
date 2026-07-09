import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type Settings = {
  id: string; mode: "creator" | "developer" | "both";
  hero_title: string; hero_subtitle: string | null; hero_media_url: string | null;
  seo_title: string | null; seo_description: string | null;
  theme_overrides: Record<string, unknown> | null;
};

function SettingsPage() {
  const [mode, setMode] = useState<"creator" | "developer">("creator");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings", mode],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("mode", mode).maybeSingle();
      if (error) throw error;
      return data as unknown as Settings | null;
    },
  });
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (v: Settings) => {
      const { error } = await supabase.from("site_settings").update({
        hero_title: v.hero_title, hero_subtitle: v.hero_subtitle, hero_media_url: v.hero_media_url,
        seo_title: v.seo_title, seo_description: v.seo_description,
        theme_overrides: v.theme_overrides ?? {},
      } as never).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "settings"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); toast.success("Settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-3xl">Site settings</h1>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["creator", "developer"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded px-3 py-1 text-xs ${mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>{m}</button>
          ))}
        </div>
      </div>
      {!form ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="mt-6 grid max-w-2xl gap-4">
          <Field label="Hero title"><input required value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} className={inputCls} /></Field>
          <Field label="Hero subtitle"><textarea rows={2} value={form.hero_subtitle ?? ""} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Hero media URL"><input value={form.hero_media_url ?? ""} onChange={(e) => setForm({ ...form, hero_media_url: e.target.value || null })} className={inputCls} /></Field>
          <Field label="SEO title"><input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value || null })} className={inputCls} /></Field>
          <Field label="SEO description"><textarea rows={2} value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Accent color override (optional)">
            <input value={(form.theme_overrides?.accent as string) ?? ""}
              onChange={(e) => setForm({ ...form, theme_overrides: { ...(form.theme_overrides ?? {}), accent: e.target.value } })}
              placeholder="#c96b3c or oklch(0.63 0.14 40)" className={inputCls} />
          </Field>
          <button className="mt-2 self-start rounded-md bg-accent px-5 py-2 text-sm text-accent-foreground">Save</button>
        </form>
      )}
    </div>
  );
}

const inputCls = "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs text-muted-foreground">{label}<div className="mt-1">{children}</div></label>;
}