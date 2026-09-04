import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/upload-media";
import { toast } from "sonner";
import { MediaImg } from "@/lib/media";
import { Eye, EyeOff, Plus, Trash2, Upload, Check, X, Grid, List } from "lucide-react";
import { isYouTubeUrl, extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/items")({
  component: ItemsPage,
});

type Section = { id: string; mode: string; key: string; title: string };
type Item = {
  id: string; section_id: string; title: string; subtitle: string | null; body: string | null;
  media_url: string | null; media_url_secondary: string | null; alt_text: string | null;
  tags: string[]; order_index: number; link_url: string | null; is_visible: boolean; meta: unknown;
};

const EMPTY_ITEMS: Item[] = [];

function ItemsPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
  const { data: items = EMPTY_ITEMS } = useQuery({
    queryKey: ["admin", "items", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase.from("section_items").select("*").eq("section_id", active!).order("order_index");
      if (error) throw error;
      return data as unknown as Item[];
    },
  });
  const [editing, setEditing] = useState<Item | null>(null);
  const [itemsLocal, setItemsLocal] = useState<Item[]>(items);

  useEffect(() => {
    setItemsLocal(items);
  }, [items]);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  const reorder = useMutation({
    mutationFn: async (newItems: Item[]) => {
      const updates = newItems.map((r, i) => supabase.from("section_items").update({ order_index: i }).eq("id", r.id));
      const res = await Promise.all(updates);
      const err = res.find((r) => r.error)?.error;
      if (err) throw err;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("section_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "items"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); },
  });
  
  const toggle = useMutation({
    mutationFn: async (row: Item) => { const { error } = await supabase.from("section_items").update({ is_visible: !row.is_visible }).eq("id", row.id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "items"] }); qc.invalidateQueries({ queryKey: ["portfolio"] }); },
  });

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldI = itemsLocal.findIndex((r) => r.id === e.active.id);
    const newI = itemsLocal.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(itemsLocal, oldI, newI);
    setItemsLocal(next);
    qc.setQueryData(["admin", "items", active], next);
    reorder.mutate(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Content items</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a section, then edit its content. Drag to reorder.</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["list", "grid"] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`rounded px-3 py-2 text-xs flex items-center gap-1 ${viewMode === mode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {mode === "list" ? <List className="h-3.5 w-3.5" /> : <Grid className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-6 block text-xs text-muted-foreground">Section
        <select value={active ?? ""} onChange={(e) => setSectionId(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm">
          {sections.map((s) => <option key={s.id} value={s.id}>[{s.mode}] {s.title}</option>)}
        </select>
      </label>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{itemsLocal.length} items</div>
        <button onClick={() => setEditing({ id: "", section_id: active ?? "", title: "", subtitle: null, body: null, media_url: null, media_url_secondary: null, alt_text: null, tags: [], order_index: 0, link_url: null, is_visible: true, meta: {} } as Item)}
          className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          <Plus className="h-4 w-4" /> New item
        </button>
      </div>
      
      {viewMode === "list" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={itemsLocal.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-2">
              {itemsLocal.map((it) => (
                <SortableItemRow key={it.id} item={it} onEdit={() => setEditing(it)} onToggle={() => toggle.mutate(it)} onDelete={() => { if (confirm("Delete this item?")) del.mutate(it.id); }} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={itemsLocal.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itemsLocal.map((it) => (
                <SortableItemCard key={it.id} item={it} onEdit={() => setEditing(it)} onToggle={() => toggle.mutate(it)} onDelete={() => { if (confirm("Delete this item?")) del.mutate(it.id); }} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} onSave={(v) => save.mutate(v)} />}
    </div>
  );
}

function SortableItemRow({ item, onEdit, onToggle, onDelete }: { item: Item; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
      className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label="Drag handle"><GripVertical className="h-4 w-4" /></button>
      {item.media_url ? <MediaImg src={item.media_url} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-muted" />}
      <button onClick={onEdit} className="flex-1 text-left">
        <div className="text-sm font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{item.subtitle ?? item.body ?? ""}</div>
      </button>
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
        {item.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function SortableItemCard({ item, onEdit, onToggle, onDelete }: { item: Item; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
      className="group relative rounded-md border border-border bg-card overflow-hidden">
      <div className="relative bg-muted h-40 overflow-hidden cursor-grab" {...attributes} {...listeners}>
        {item.media_url ? <MediaImg src={item.media_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" /> : <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onToggle} className="rounded-md bg-background/80 p-1.5 text-muted-foreground hover:text-foreground text-sm">
            {item.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="rounded-md bg-background/80 p-1.5 text-muted-foreground hover:text-destructive text-sm">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <button onClick={onEdit} className="text-left w-full">
          <h3 className="text-sm font-medium line-clamp-2 hover:text-accent transition">{item.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.subtitle ?? item.body ?? ""}</p>
        </button>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-0" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] md:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-4 md:p-6 flex flex-col">
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
          className="mt-4 grid gap-3 flex-1 overflow-y-auto"
        >
          <Field label="Title" required><input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className={inputCls} /></Field>
          <Field label="Subtitle"><input value={values.subtitle ?? ""} onChange={(e) => setValues({ ...values, subtitle: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Body (markdown)"><textarea rows={4} value={values.body ?? ""} onChange={(e) => setValues({ ...values, body: e.target.value || null })} className={inputCls} /></Field>
          <Field label="Primary media">
            <div className="flex items-center gap-2">
              <input value={values.media_url ?? ""} onChange={(e) => setValues({ ...values, media_url: e.target.value || null })} className={inputCls} placeholder="https://... or upload" />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs shrink-0">
                <Upload className="h-3.5 w-3.5" /> {uploading === "primary" ? "…" : "Upload"}
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && upload(e.target.files[0], "primary")} />
              </label>
            </div>
          </Field>
          <Field label="Secondary media (before/after 'before' image)">
            <div className="flex items-center gap-2">
              <input value={values.media_url_secondary ?? ""} onChange={(e) => setValues({ ...values, media_url_secondary: e.target.value || null })} className={inputCls} />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs shrink-0">
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
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition shrink-0 ${
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
                <p className="mb-2 text-xs text-muted-foreground">YouTube Preview (click-to-play facade)</p>
                <div className="relative aspect-[16/9] w-full rounded overflow-hidden bg-black">
                  <div
                    onClick={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      const id = youtubeId;
                      el.innerHTML = `<iframe src="${getYouTubeEmbedUrl(id, true)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:100%;position:absolute;inset:0"></iframe>`;
                    }}
                    className="group absolute inset-0 cursor-pointer overflow-hidden"
                  >
                    {values.media_url ? (
                      <img src={values.media_url} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-900 to-black" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 group-hover:bg-white transition shadow-lg group-hover:shadow-2xl">
                        <svg className="h-6 w-6 fill-black ml-0.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M5 3v18l15-9L5 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Field>
          <Field label="Order index"><input type="number" value={values.order_index} onChange={(e) => setValues({ ...values, order_index: Number(e.target.value) })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.is_visible} onChange={(e) => setValues({ ...values, is_visible: e.target.checked })} />
            Visible (published)
          </label>
          <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sticky bottom-0 bg-card pt-3 border-t border-border">
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