import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Trash2, Plus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SECTION_DEFINITIONS, type SectionKey } from "@/lib/section-catalog";

export const Route = createFileRoute("/_authenticated/admin/sections")({
  component: SectionsPage,
});

type Row = { id: string; mode: string; key: string; title: string; subtitle: string | null; order_index: number; is_visible: boolean };

function SectionsPage() {
  const [mode, setMode] = useState<"creator" | "developer">("creator");
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "sections", mode],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("*").eq("mode", mode).order("order_index");
      if (error) throw error;
      return data as Row[];
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reorder = useMutation({
    mutationFn: async (rows: Row[]) => {
      const updates = rows.map((r, i) => supabase.from("sections").update({ order_index: i }).eq("id", r.id));
      const res = await Promise.all(updates);
      const err = res.find((r) => r.error)?.error;
      if (err) throw err;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections"] }),
  });

  const toggle = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("sections").update({ is_visible: !row.is_visible }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sections").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections"] }),
  });

  const update = useMutation({
    mutationFn: async (row: { id: string; title: string; subtitle: string | null }) => {
      const { error } = await supabase.from("sections").update({ title: row.title, subtitle: row.subtitle }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "sections"] }); toast.success("Section updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async (payload: { key: string; title: string }) => {
      const nextOrder = (data[data.length - 1]?.order_index ?? -1) + 1;
      const { error } = await supabase.from("sections").insert({ mode, key: payload.key, title: payload.title, order_index: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "sections"] }); toast.success("Section added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldI = data.findIndex((r) => r.id === e.active.id);
    const newI = data.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(data, oldI, newI);
    qc.setQueryData(["admin", "sections", mode], next);
    reorder.mutate(next);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-heading text-3xl">Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag to reorder. Toggle visibility to publish/unpublish.</p>
        </div>
        <ModeTabs value={mode} onChange={setMode} />
      </div>
      <NewSectionForm onSubmit={(v) => create.mutate(v)} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={data.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-6 space-y-2">
            {data.map((row) => (
              <SortableRow key={row.id} row={row}
                onToggle={() => toggle.mutate(row)}
                onSave={(v) => update.mutate({ id: row.id, ...v })}
                onDelete={() => { if (confirm("Delete section and all its items?")) del.mutate(row.id); }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ModeTabs({ value, onChange }: { value: "creator" | "developer"; onChange: (v: "creator" | "developer") => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {(["creator", "developer"] as const).map((m) => (
        <button key={m} onClick={() => onChange(m)}
          className={`rounded px-3 py-1 text-xs font-body ${value === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {m}
        </button>
      ))}
    </div>
  );
}

function NewSectionForm({ onSubmit }: { onSubmit: (v: { key: string; title: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<SectionKey>("photography");
  const [title, setTitle] = useState("");
  const selected = SECTION_DEFINITIONS.find((definition) => definition.key === key)!;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-6 inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
        <Plus className="h-4 w-4" /> Add section
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onSubmit({ key, title: title.trim() }); setTitle(""); setOpen(false); }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-card p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl">Choose a section type</h2>
                <p className="mt-1 text-sm text-muted-foreground">Each key controls the layout and fields available for its content.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {SECTION_DEFINITIONS.map((definition) => (
                <button key={definition.key} type="button" onClick={() => setKey(definition.key)} className={`rounded-md border p-3 text-left transition ${key === definition.key ? "border-accent bg-accent/10" : "border-border hover:border-accent/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{definition.label}</span>
                    <code className="text-[10px] text-muted-foreground">{definition.key}</code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{definition.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">Selected key: <code className="text-foreground">{selected.key}</code></div>
              <label className="text-xs text-muted-foreground">Section title *
                <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={selected.label} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
                <button className="rounded-md bg-accent px-4 py-2 text-sm text-accent-foreground">Create section</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function SortableRow({ row, onToggle, onDelete, onSave }: { row: Row; onToggle: () => void; onDelete: () => void; onSave: (v: { title: string; subtitle: string | null }) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [subtitle, setSubtitle] = useState(row.subtitle ?? "");
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
      className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label="Drag handle"><GripVertical className="h-4 w-4" /></button>
      {editing ? (
        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Section title"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Title" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} aria-label="Section subtitle"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Subtitle" />
        </div>
      ) : (
        <div className="flex-1">
          <div className="text-sm font-medium">{row.title}</div>
          {row.subtitle && <div className="text-xs text-foreground/70">{row.subtitle}</div>}
          <div className="text-xs text-muted-foreground">{row.key} · order {row.order_index}</div>
        </div>
      )}
      {editing ? (
        <>
          <button onClick={() => { onSave({ title: title.trim() || row.title, subtitle: subtitle.trim() || null }); setEditing(false); }}
            className="text-accent hover:opacity-80" aria-label="Save section"><Check className="h-4 w-4" /></button>
          <button onClick={() => { setTitle(row.title); setSubtitle(row.subtitle ?? ""); setEditing(false); }}
            className="text-muted-foreground hover:text-foreground" aria-label="Cancel edit"><X className="h-4 w-4" /></button>
        </>
      ) : (
        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground" aria-label="Edit section">
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">
        {row.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}