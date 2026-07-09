import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

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
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!key || !title) return; onSubmit({ key, title }); setKey(""); setTitle(""); }}
      className="mt-6 flex flex-wrap items-end gap-2"
    >
      <label className="text-xs text-muted-foreground">Key
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="photography"
          className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm" />
      </label>
      <label className="text-xs text-muted-foreground">Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photography"
          className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm" />
      </label>
      <button className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
        <Plus className="h-4 w-4" /> Add section
      </button>
    </form>
  );
}

function SortableRow({ row, onToggle, onDelete }: { row: Row; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
      className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label="Drag handle"><GripVertical className="h-4 w-4" /></button>
      <div className="flex-1">
        <div className="text-sm font-medium">{row.title}</div>
        <div className="text-xs text-muted-foreground">{row.key} · order {row.order_index}</div>
      </div>
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">
        {row.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}