import { MediaImg } from "@/lib/media";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/upload-media";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  component: TestimonialsPage,
});

type T = { id: string; client_name: string; client_title: string | null; quote: string; avatar_url: string | null; order_index: number; is_visible: boolean };

function TestimonialsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("order_index");
      if (error) throw error;
      return data as T[];
    },
  });
  const [editing, setEditing] = useState<T | null>(null);

  const save = useMutation({
    mutationFn: async (v: Partial<T> & { id?: string }) => {
      if (v.id) { const { id, ...rest } = v; const { error } = await supabase.from("testimonials").update(rest as never).eq("id", id!); if (error) throw error; }
      else {
        const nextOrder = (data[data.length - 1]?.order_index ?? -1) + 1;
        const { error } = await supabase.from("testimonials").insert({ ...v, order_index: nextOrder, client_name: v.client_name ?? "", quote: v.quote ?? "" } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("testimonials").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }),
  });
  const toggle = useMutation({
    mutationFn: async (row: T) => { const { error } = await supabase.from("testimonials").update({ is_visible: !row.is_visible }).eq("id", row.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }),
  });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-3xl">Testimonials</h1>
        <button onClick={() => setEditing({ id: "", client_name: "", client_title: "", quote: "", avatar_url: "", order_index: 0, is_visible: true })}
          className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground"><Plus className="h-4 w-4" /> New</button>
      </div>
      <ul className="mt-6 space-y-2">
        {data.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
            {t.avatar_url ? <MediaImg src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-muted" />}
            <button onClick={() => setEditing(t)} className="flex-1 text-left">
              <div className="text-sm font-medium">{t.client_name} <span className="text-xs text-muted-foreground">{t.client_title}</span></div>
              <div className="text-xs text-muted-foreground line-clamp-1">"{t.quote}"</div>
            </button>
            <button onClick={() => toggle.mutate(t)} className="text-muted-foreground hover:text-foreground">{t.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
            <button onClick={() => { if (confirm("Delete?")) del.mutate(t.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      {editing && <Editor t={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} />}
    </div>
  );
}

function Editor({ t, onSave, onClose }: { t: T; onSave: (v: Partial<T> & { id?: string }) => void; onClose: () => void }) {
  const [v, setV] = useState(t);
  const [uploading, setUploading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); const payload: Partial<T> & { id?: string } = { ...v }; if (!payload.id) delete payload.id; onSave(payload); }}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <h2 className="font-heading text-xl">{t.id ? "Edit" : "New"} testimonial</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <label className="text-xs text-muted-foreground">Client name<input required value={v.client_name} onChange={(e) => setV({ ...v, client_name: e.target.value })} className={inputCls} /></label>
          <label className="text-xs text-muted-foreground">Client title<input value={v.client_title ?? ""} onChange={(e) => setV({ ...v, client_title: e.target.value || null })} className={inputCls} /></label>
          <label className="text-xs text-muted-foreground">Quote<textarea required rows={4} value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} className={inputCls} /></label>
          <label className="text-xs text-muted-foreground">Avatar URL
            <div className="mt-1 flex items-center gap-2">
              <input value={v.avatar_url ?? ""} onChange={(e) => setV({ ...v, avatar_url: e.target.value || null })} className={inputCls} placeholder="https://... or upload" />
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const url = await uploadMediaFile(file);
                    setV((prev) => ({ ...prev, avatar_url: url }));
                    toast.success("Uploaded to Cloudinary");
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }} />
              </label>
            </div>
          </label>
          <label className="text-xs text-muted-foreground">Order<input type="number" value={v.order_index} onChange={(e) => setV({ ...v, order_index: Number(e.target.value) })} className={inputCls} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.is_visible} onChange={(e) => setV({ ...v, is_visible: e.target.checked })} /> Visible</label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
          <button className="rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground">Save</button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
