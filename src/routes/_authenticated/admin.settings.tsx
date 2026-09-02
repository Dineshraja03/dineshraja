import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/upload-media";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type Settings = {
  id: string; mode: "creator" | "developer" | "both";
  hero_title: string; hero_subtitle: string | null; hero_media_url: string | null;
  hero_media_url_pc: string | null; hero_media_url_mobile: string | null;
  seo_title: string | null; seo_description: string | null;
  theme_overrides: Record<string, unknown> | null;
};

function SettingsPage() {
  const [mode, setMode] = useState<"creator" | "developer">("creator");
  const [uploadingHero, setUploadingHero] = useState<null | "primary" | "pc" | "mobile">(null);
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
        hero_media_url_pc: v.hero_media_url_pc, hero_media_url_mobile: v.hero_media_url_mobile,
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
          <div className="rounded-md border border-border/50 bg-card/50 p-4">
            <h3 className="mb-3 text-sm font-medium">Hero images by device</h3>
            <div className="space-y-3">
              <Field label="PC landscape hero (≥768px)">
                <div className="flex items-center gap-2">
                  <input value={form.hero_media_url_pc ?? ""} onChange={(e) => setForm({ ...form, hero_media_url_pc: e.target.value || null })} className={inputCls} placeholder="https://... or upload" />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" /> {uploadingHero === "pc" ? "…" : "Upload"}
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingHero("pc");
                      try {
                        const url = await uploadMediaFile(file);
                        setForm((f) => f ? { ...f, hero_media_url_pc: url } : f);
                        toast.success("Uploaded to Cloudinary");
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setUploadingHero(null);
                        e.target.value = "";
                      }
                    }} />
                  </label>
                </div>
              </Field>
              <Field label="Mobile hero (<768px)">
                <div className="flex items-center gap-2">
                  <input value={form.hero_media_url_mobile ?? ""} onChange={(e) => setForm({ ...form, hero_media_url_mobile: e.target.value || null })} className={inputCls} placeholder="https://... or upload" />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" /> {uploadingHero === "mobile" ? "…" : "Upload"}
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingHero("mobile");
                      try {
                        const url = await uploadMediaFile(file);
                        setForm((f) => f ? { ...f, hero_media_url_mobile: url } : f);
                        toast.success("Uploaded to Cloudinary");
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setUploadingHero(null);
                        e.target.value = "";
                      }
                    }} />
                  </label>
                </div>
              </Field>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Upload device-specific hero images for optimal display on different screen sizes.</p>
          </div>
          <Field label="SEO title"><input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value || null })} className={inputCls} /></Field>
          <Field label="SEO description"><textarea rows={2} value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value || null })} className={inputCls} /></Field>
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