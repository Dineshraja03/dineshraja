import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messages — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Msg = {
  id: string; name: string; email: string; message: string;
  mode: "creator" | "developer" | "both"; is_read: boolean; created_at: string;
};

function MessagesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Msg[];
    },
  });

  const toggleRead = useMutation({
    mutationFn: async (m: Msg) => {
      const { error } = await supabase.from("contact_messages").update({ is_read: !m.is_read } as never).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "messages"] }); toast.success("Message deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const all = data ?? [];
  const unread = all.filter((m) => !m.is_read).length;
  const rows = filter === "unread" ? all.filter((m) => !m.is_read) : all;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">People who reached out through your contact forms.</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["all", "unread"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs capitalize ${filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}{f === "unread" && unread ? ` (${unread})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total" value={all.length} />
        <Stat label="Unread" value={unread} />
        <Stat label="From dev mode" value={all.filter((m) => m.mode === "developer").length} />
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No messages yet.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((m) => {
            const open = openId === m.id;
            return (
              <li key={m.id} className={`rounded-lg border bg-card p-4 transition ${m.is_read ? "border-border" : "border-accent/60"}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => setOpenId(open ? null : m.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base">{m.name}</span>
                      {!m.is_read && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">new</span>}
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{m.mode}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{m.email} · {new Date(m.created_at).toLocaleString()}</div>
                    <p className={`mt-2 whitespace-pre-wrap text-sm text-foreground/90 ${open ? "" : "line-clamp-2"}`}>{m.message}</p>
                  </button>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button title={m.is_read ? "Mark unread" : "Mark read"} onClick={() => toggleRead.mutate(m)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground">
                      {m.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </button>
                    <a title="Reply by email" href={`mailto:${encodeURIComponent(m.email)}`}
                      className="rounded-md border border-border p-2 text-center text-xs text-muted-foreground hover:text-foreground">↩</a>
                    <button title="Delete" onClick={() => remove.mutate(m.id)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl">{value}</div>
    </div>
  );
}
