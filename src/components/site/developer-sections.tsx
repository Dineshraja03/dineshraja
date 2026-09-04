import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Section, SectionItem } from "@/lib/portfolio";
import { itemsFor } from "@/lib/portfolio";
import { sendContactMessage } from "@/lib/contact";
import { toast } from "sonner";
import { MediaImg } from "@/lib/media";
import { normalizedSectionKey } from "@/lib/section-catalog";

export function DeveloperHero({ title, subtitle }: { title: string; subtitle: string | null }) {
  const lines = [
    { prompt: "$ whoami", out: title },
    { prompt: "$ cat about.md", out: subtitle ?? "" },
    { prompt: "$ ls skills/", out: "typescript  rust  react  postgres  webgl  edge" },
  ];
  return (
    <section className="relative isolate flex min-h-[92vh] items-center py-24">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="rounded-lg border border-border bg-card font-mono-token shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-[oklch(0.65_0.2_25)]" />
            <span className="h-3 w-3 rounded-full bg-[oklch(0.8_0.16_85)]" />
            <span className="h-3 w-3 rounded-full bg-[oklch(0.75_0.16_145)]" />
            <span className="ml-3">~/portfolio — zsh</span>
          </div>
          <div className="p-6 text-sm md:text-base">
            {lines.map((l, i) => <TypingLine key={i} prompt={l.prompt} out={l.out} delay={i * 0.6} />)}
            <div className="mt-4 flex items-center gap-2 text-accent">
              <span>$</span><span className="cursor-blink">▊</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TypingLine({ prompt, out, delay }: { prompt: string; out: string; delay: number }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let i = 0; let raf = 0; let start = 0;
    const startAt = performance.now() + delay * 1000;
    const tick = (t: number) => {
      if (t < startAt) { raf = requestAnimationFrame(tick); return; }
      if (!start) start = t;
      const chars = Math.min(out.length, Math.floor((t - start) / 18));
      if (chars !== i) { i = chars; setTyped(out.slice(0, i)); }
      if (i < out.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [out, delay]);
  return (
    <div className="mb-2 leading-relaxed">
      <span className="text-accent">{prompt}</span>
      <div className="pl-4 text-foreground/90 whitespace-pre-wrap">{typed}</div>
    </div>
  );
}

function Header({ section }: { section: Section }) {
  return (
    <header className="mx-auto mb-8 max-w-6xl px-6">
      <h2 className="font-mono-token text-2xl text-accent md:text-3xl">{section.title}</h2>
      {section.subtitle && <p className="mt-1 font-body text-sm text-muted-foreground">// {section.subtitle}</p>}
    </header>
  );
}

function langColor(meta: Record<string, unknown>) {
  const c = typeof meta?.lang_color === "string" ? meta.lang_color : "#888";
  const lang = typeof meta?.lang === "string" ? meta.lang : "code";
  const stars = typeof meta?.stars === "number" ? meta.stars : null;
  return { color: c, lang, stars };
}

function Projects({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-16 md:py-24">
      <Header section={section} />
      <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-2">
        {list.map((it, i) => {
          const { color, lang, stars } = langColor(it.meta);
          return (
            <motion.a
              key={it.id} href={it.link_url ?? undefined} target="_blank" rel="noreferrer"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group block rounded-md border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_0_0_1px_var(--color-accent)]"
            >
              {it.media_url && <MediaImg src={it.media_url} alt={it.alt_text ?? it.title} className="mb-4 aspect-video w-full rounded object-cover" loading="lazy" />}
              <div className="flex items-center gap-2 font-mono-token text-sm">
                <span className="text-accent">⌘</span>
                <span className="text-foreground">{it.title}</span>
                {stars !== null && <span className="ml-auto text-xs text-muted-foreground">★ {stars}</span>}
              </div>
              <p className="mt-2 font-body text-sm text-muted-foreground">{it.subtitle}</p>
              {it.body && <p className="mt-3 font-body text-sm text-foreground/80">{it.body}</p>}
              <div className="mt-4 flex items-center gap-2 font-mono-token text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{lang}</span>
                <span className="ml-auto flex gap-1">
                  {it.tags.slice(0, 3).map((t) => <span key={t} className="rounded border border-border px-1.5 py-0.5">{t}</span>)}
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}

function Experiments({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-16 md:py-24">
      <Header section={section} />
      <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
        {list.map((it) => (
          <div key={it.id} className="rounded-md border border-dashed border-border bg-card p-5">
            {it.media_url && <MediaImg src={it.media_url} alt={it.alt_text ?? it.title} className="mb-4 aspect-video w-full rounded object-cover" loading="lazy" />}
            <div className="font-mono-token text-sm text-accent">~/exp/{it.title}</div>
            <div className="mt-1 font-body text-xs text-muted-foreground">{it.subtitle}</div>
            <p className="mt-3 font-body text-sm text-foreground/80">{it.body}</p>
            <div className="mt-3 flex flex-wrap gap-1 font-mono-token text-[10px] text-muted-foreground">
              {it.tags.map((t) => <span key={t} className="rounded bg-muted px-1.5 py-0.5">#{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stack({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-16 md:py-24">
      <Header section={section} />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
        {list.map((row) => (
          <div key={row.id} className="rounded-md border border-border bg-card p-5">
            <div className="font-mono-token text-sm text-accent">// {row.title.toLowerCase()}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.tags.map((t) => (
                <span key={t} className="rounded border border-border bg-background px-2.5 py-1 font-mono-token text-xs text-foreground/90">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact({ section }: { section: Section }) {
  const [log, setLog] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"name" | "email" | "message">("name");
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  const prompts = { name: "your name?", email: "your email or phone?", message: "your message?" } as const;
  return (
    <section className="py-16 md:py-24">
      <Header section={section} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const value = input.trim();
          if (!value) return;
          setLog((l) => [...l, `$ ${value}`]);
          setInput("");
          if (step === "name") { setDraft((d) => ({ ...d, name: value })); setStep("email"); return; }
          if (step === "email") { setDraft((d) => ({ ...d, email: value })); setStep("message"); return; }
          const payload = { ...draft, message: value };
          try {
            await sendContactMessage(payload, "developer");
            setLog((l) => [...l, "→ message sent. I'll reply within 48h."]);
            setDraft({ name: "", email: "", message: "" });
            setStep("name");
            toast.success("Message sent");
          } catch {
            setLog((l) => [...l, "→ error: could not send. check your details and retry."]);
            setStep("name");
          }
        }}
        className="mx-auto max-w-3xl px-6"
      >
        <div className="rounded-md border border-border bg-card p-5 font-mono-token text-sm">
          <div className="text-muted-foreground">// answer each prompt and hit enter</div>
          {log.map((l, i) => <div key={i} className={l.startsWith("→") ? "text-accent" : "text-foreground"}>{l}</div>)}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-accent">dinesh@dev:~ {prompts[step]}</span>
            <input
              autoFocus={false} value={input} onChange={(e) => setInput(e.target.value)}
              aria-label={prompts[step]}
              className="flex-1 bg-transparent font-mono-token text-foreground outline-none placeholder:text-muted-foreground"
              placeholder={step === "message" ? "hello, want to build..." : ""}
            />
          </div>
        </div>
      </form>
    </section>
  );
}

export function DeveloperSectionRenderer({ section, items }: { section: Section; items: SectionItem[] }) {
  switch (normalizedSectionKey(section.key)) {
    case "project": return <Projects section={section} items={items} />;
    case "experiments": return <Experiments section={section} items={items} />;
    case "stack": return <Stack section={section} items={items} />;
    case "contact": return <Contact section={section} />;
    default: return null;
  }
}