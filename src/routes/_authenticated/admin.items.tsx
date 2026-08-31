import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/upload-media";
import { toast } from "sonner";
import { MediaImg } from "@/lib/media";
import { Eye, EyeOff, Plus, Trash2, Upload, Check, X } from "lucide-react";
import { isYouTubeUrl, extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

export const Route = createFileRoute("/_authenticated/admin/items")({
  component: ItemsPage,
});

type Section = { id: string; mode: string; key: string; title: string };
type Item = {
  id: string; section_id: string; title: string; subtitle: string | null; body: string | null;
  media_url: string | null; media_url_secondary: string | null; alt_text: string | null;
  tags: string[]; order_index: number; link_url: string | null; is_visible: boolean; meta: unknown;
};

function ItemsPage() {
  const qc = useQueryClient();
  const { data: sections = [] } = useQuery({
    queryKey: ["admin", "all-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id, mode, key, title").order("mode").order("order_index");
      if (error) throw error;
      return data as Section[];
    },
  });
  const [sectionId, setSectionId] = useState<string | null>(null);
  const active = sectionId ?? sections[0]?.id ?? null;
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "items", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase.from("section_items").select("*").eq("section_id", active!).order("order_index");
      if (error) throw error;
      return data as unknown as Item[];
    },
  });
  const [editing, setEditing] = useState<Item | null>(null);

  const save = useMutation({
    mutationFn: async (values: Partial<Item> & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase.from("section_items").update(values as never).eq("id", values.id);
        if (error) throw error;
      } else {
        const nextOrder = (items[items.length - 1]?.order_index ?? -1) + 1;
        const { error } = await supabase.from("section_items").insert({ ...values, section_id: active!, order_index: nextOrder } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "items"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("section_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "items"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); },
  });
  const toggle = useMutation({
    mutationFn: async (row: Item) => { const { error } = await supabase.from("section_items").update({ is_visible: !row.is_visible }).eq("id", row.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "items"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); },
  });

  return (
    <div>
      <h1 className="font-heading text-3xl">Content items</h1>
      <p className="mt-1 text-sm text-muted-foreground">Pick a section, then edit its content.</p>
      <label className="mt-6 block text-xs text-muted-foreground">Section
        <select value={active ?? ""} onChange={(e) => setSectionId(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm">
          {sections.map((s) => <option key={s.id} value={s.id}>[{s.mode}] {s.title}</option>)}
        </select>
      </label>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{items.length} items</div>
        <button onClick={() => setEditing({ id: "", section_id: active ?? "", title: "", subtitle: null, body: null, media_url: null, media_url_secondary: null, alt_text: null, tags: [], order_index: 0, link_url: null, is_visible: true, meta: {} } as Item)}
          className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          <Plus className="h-4 w-4" /> New item
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
            {it.media_url ? <MediaImg src={it.media_url} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-muted" />}
            <button onClick={() => setEditing(it)} className="flex-1 text-left">
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{it.subtitle ?? it.body ?? ""}</div>
            </button>
            <button onClick={() => toggle.mutate(it)} className="text-muted-foreground hover:text-foreground">
              {it.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button onClick={() => { if (confirm("Delete this item?")) del.mutate(it.id); }} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} />}
    </div>
  );
}

function ItemEditor({ item, onSave, onClose }: { item: Item; onSave: (v: Partial<Item> & { id?: string }) => void; onClose: () => void }) {
  const isNew = !item.id;
  const [values, setValues] = useState<Item>(item);
  const [uploading, setUploading] = useState<null | "primary" | "secondary">(null);
  const [showYouTubePreview, setShowYouTubePreview] = useState(false);
  const youtubeId = values.link_url ? extractYouTubeId(values.link_url) : null;
  const isValidYouTube = youtubeId !== null;

  async function upload(file: File, target: "primary" | "secondary") {
    setUploading(target);
    try {
      const url = await uploadMediaFile(file);
      setValues((v) => target === "primary" ? { ...v, media_url: url } : { ...v, media_url_secondary: url });
      toast.success("Uploaded to Cloudinary");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl">{isNew ? "New item" : "Edit item"}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground">Close</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!values.alt_text && values.media_url) { toast.error("Alt text is required when there's an image."); return; }
            const payload: Partial<Item> & { id?: string } = { ...values };
            if (!payload.id) delete payload.id;
            onSave(payload);
          }}
          className="mt-4 grid gap-3"
        >
          <Field label="Title" required><input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className={inputCls} /></Field>
          <Field label="Subtitle"><input value={values.subtitle ?? ""} onChange={(e) => setValues({ ...values, subtitle: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Body (markdown)"><textarea rows={4} value={values.body ?? ""} onChange={(e) => setValues({ ...values, body: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Primary media">
            <div className="flex items-center gap-2">
              <input value={values.media_url ?? ""} onChange={(e) => setValues({ ...values, media_url: e.target.value || null })} className={inputCls} placeholder="https://... or upload" />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <Upload className="h-3.5 w-3.5" /> {uploading === "primary" ? "…" : "Upload"}
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && upload(e.target.files[0], "primary")} />
              </label>
            </div>
          </Field>
          <Field label="Secondary media (before/after 'before' image)">
            <div className="flex items-center gap-2">
              <input value={values.media_url_secondary ?? ""} onChange={(e) => setValues({ ...values, media_url_secondary: e.target.value || null })} className={inputCls} />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <Upload className="h-3.5 w-3.5" /> {uploading === "secondary" ? "…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && upload(e.target.files[0], "secondary")} />
              </label>
            </div>
          </Field>
          <Field label="Alt text (required for images)"><input value={values.alt_text ?? ""} onChange={(e) => setValues({ ...values, alt_text: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Tags (comma-separated)">
            <input value={values.tags.join(", ")} onChange={(e) => setValues({ ...values, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
          </Field>
          <Field label="Link URL">
            <div className="flex items-center gap-2">
              <input value={values.link_url ?? ""} onChange={(e) => setValues({ ...values, link_url: e.target.value || null })} className={inputCls} placeholder="YouTube URL" />
              <button
                type="button"
                onClick={() => setShowYouTubePreview(!showYouTubePreview)}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                  isValidYouTube
                    ? "bg-green-600/20 text-green-600 hover:bg-green-600/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {isValidYouTube ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {isValidYouTube ? "Valid YouTube" : "Not YouTube"}
              </button>
            </div>
            {isValidYouTube && showYouTubePreview && (
              <div className="mt-3 rounded-md border border-border bg-black/20 p-3">
                <p className="mb-2 text-xs text-muted-foreground">YouTube Preview</p>
                <iframe
                  width="100%"
                  height="300"
                  src={getYouTubeEmbedUrl(youtubeId)}
                  title="YouTube preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded"
                />
              </div>
            )}
          </Field>
          <Field label="Order index"><input type="number" value={values.order_index} onChange={(e) => setValues({ ...values, order_index: Number(e.target.value) })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.is_visible} onChange={(e) => setValues({ ...values, is_visible: e.target.checked })} />
            Visible (published)
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
            <button className="rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-xs text-muted-foreground">{label}{required && " *"}<div className="mt-1">{children}</div></label>;
}