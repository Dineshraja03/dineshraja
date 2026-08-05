import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Section, SectionItem, Testimonial } from "@/lib/portfolio";
import { itemsFor } from "@/lib/portfolio";

export function CreatorHero({ title, subtitle, media }: { title: string; subtitle: string | null; media: string | null }) {
  return (
    <section className="relative isolate flex min-h-[92vh] w-full items-end overflow-hidden">
      {media && (
        <img src={media} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover animate-develop" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 md:pb-24">
        <motion.h1
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground md:text-8xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-xl font-body text-base text-foreground/80 md:text-lg"
          >{subtitle}</motion.p>
        )}
      </div>
    </section>
  );
}

function SectionHeader({ section }: { section: Section }) {
  return (
    <header className="mx-auto mb-10 flex max-w-6xl flex-col items-baseline gap-2 px-6 md:mb-14 md:flex-row md:justify-between">
      <h2 className="font-heading text-3xl tracking-tight md:text-5xl">{section.title}</h2>
      {section.subtitle && <p className="font-body text-sm text-muted-foreground md:text-base">{section.subtitle}</p>}
    </header>
  );
}

function Photography({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  const allTags = useMemo(() => Array.from(new Set(list.flatMap((i) => i.tags))), [list]);
  const [tag, setTag] = useState<string | null>(null);
  const filtered = tag ? list.filter((i) => i.tags.includes(tag)) : list;
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2 px-6">
        <button onClick={() => setTag(null)} className={`rounded-full border px-3 py-1 text-xs font-body transition ${tag === null ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>All</button>
        {allTags.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={`rounded-full border px-3 py-1 text-xs font-body transition ${tag === t ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>
      <div className="mx-auto max-w-6xl columns-1 gap-4 px-6 sm:columns-2 lg:columns-3">
        {filtered.map((it, i) => (
          <motion.figure
            key={it.id}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="mb-4 break-inside-avoid overflow-hidden rounded-md bg-muted"
          >
            {it.media_url && <img src={it.media_url} alt={it.alt_text ?? it.title} className="h-auto w-full object-cover" loading="lazy" />}
            <figcaption className="flex items-baseline justify-between px-3 py-2 text-xs text-muted-foreground">
              <span className="font-heading text-sm text-foreground">{it.title}</span>
              {it.subtitle && <span>{it.subtitle}</span>}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function Videography({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-2">
        {list.map((it, i) => (
          <motion.a
            key={it.id} href={it.link_url ?? undefined} target="_blank" rel="noreferrer"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`group relative block overflow-hidden rounded-lg ${i === 0 ? "md:col-span-2" : ""}`}
          >
            {it.media_url && <img src={it.media_url} alt={it.alt_text ?? it.title} className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <div className="flex items-center gap-2 text-xs font-body opacity-90">▶ {it.subtitle}</div>
              <h3 className="font-heading text-2xl md:text-3xl">{it.title}</h3>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function BeforeAfter({ it }: { it: SectionItem }) {
  const [pos, setPos] = useState(50);
  return (
    <figure className="relative overflow-hidden rounded-lg border border-border">
      <div className="relative aspect-[16/9]">
        {it.media_url_secondary && <img src={it.media_url_secondary} alt={`${it.alt_text ?? it.title} — after`} className="absolute inset-0 h-full w-full object-cover" />}
        {it.media_url && (
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img src={it.media_url} alt={`${it.alt_text ?? it.title} — before`} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow" style={{ left: `${pos}%` }} aria-hidden />
        <input
          type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${it.title} before/after slider`}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        />
        <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs font-body text-white">before</span>
        <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs font-body text-white">after</span>
      </div>
      <figcaption className="flex items-baseline justify-between px-4 py-3">
        <span className="font-heading text-lg">{it.title}</span>
        {it.subtitle && <span className="text-xs text-muted-foreground">{it.subtitle}</span>}
      </figcaption>
    </figure>
  );
}

function Editing({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
        {list.map((it) => <BeforeAfter key={it.id} it={it} />)}
      </div>
    </section>
  );
}

function Design({ section, items }: { section: Section; items: SectionItem[] }) {
  const list = itemsFor(items, section.id);
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        {list.map((it, i) => (
          <motion.a
            key={it.id} href={it.link_url ?? undefined}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group block overflow-hidden rounded-lg border border-border bg-card transition hover:border-accent"
          >
            {it.media_url && <img src={it.media_url} alt={it.alt_text ?? it.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />}
            <div className="p-5">
              <div className="text-xs uppercase tracking-widest text-accent">{it.subtitle}</div>
              <h3 className="mt-1 font-heading text-xl">{it.title}</h3>
              {it.body && <p className="mt-2 font-body text-sm text-muted-foreground">{it.body}</p>}
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function About({ section, items }: { section: Section; items: SectionItem[] }) {
  const it = itemsFor(items, section.id)[0];
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[1fr_1.3fr]">
        {it?.media_url && (
          <img src={it.media_url} alt={it.alt_text ?? ""} className="aspect-[4/5] w-full rounded-lg object-cover" loading="lazy" />
        )}
        <div>
          <h3 className="font-heading text-3xl md:text-4xl">{it?.title}</h3>
          <p className="mt-4 font-body text-base leading-relaxed text-foreground/80 md:text-lg">{it?.body}</p>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ section, testimonials }: { section: Section; testimonials: Testimonial[] }) {
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.id} className="rounded-lg border border-border bg-card p-6">
            <blockquote className="font-heading text-lg leading-snug">“{t.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {t.avatar_url && <img src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
              <div>
                <div className="font-body text-sm font-medium">{t.client_name}</div>
                {t.client_title && <div className="text-xs text-muted-foreground">{t.client_title}</div>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Contact({ section }: { section: Section }) {
  const [sending, setSending] = useState(false);
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const form = e.currentTarget;
          setSending(true);
          try {
            await sendContactMessage(
              { name: String(fd.get("name") ?? ""), email: String(fd.get("email") ?? ""), message: String(fd.get("message") ?? "") },
              "creator",
            );
            form.reset();
            toast.success("Thanks — I'll be in touch soon.");
          } catch (err) {
            toast.error(err instanceof z.ZodError ? (err.issues[0]?.message ?? "Invalid input") : "Could not send. Please try again.");
          } finally {
            setSending(false);
          }
        }}
        className="mx-auto grid max-w-2xl gap-4 px-6"
      >
        <input required name="name" placeholder="Your name" className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <input required type="email" name="email" placeholder="Email" className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <textarea required name="message" placeholder="What are you working on?" rows={5} className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <button type="submit" disabled={sending} className="rounded-md bg-accent px-6 py-3 font-heading text-base text-accent-foreground transition hover:opacity-90 disabled:opacity-60">{sending ? "Sending…" : "Send message"}</button>
      </form>
    </section>
  );
}

export function CreatorSectionRenderer({ section, items, testimonials }: { section: Section; items: SectionItem[]; testimonials: Testimonial[] }) {
  switch (section.key) {
    case "photography": return <Photography section={section} items={items} />;
    case "videography": return <Videography section={section} items={items} />;
    case "editing": return <Editing section={section} items={items} />;
    case "design": return <Design section={section} items={items} />;
    case "about": return <About section={section} items={items} />;
    case "testimonials": return <Testimonials section={section} testimonials={testimonials} />;
    case "contact": return <Contact section={section} />;
    default: return null;
  }
}