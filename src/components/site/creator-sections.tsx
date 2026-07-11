import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import type { Section, SectionItem, Testimonial } from "@/lib/portfolio";
import { itemsFor } from "@/lib/portfolio";

const NICHES: { title: string; hint: string; span: string }[] = [
  { title: "Portrait", hint: "Studio · Editorial", span: "col-span-2 row-span-2" },
  { title: "Landscape", hint: "Wide · Golden hour", span: "col-span-2 row-span-1" },
  { title: "Street", hint: "Candid · Documentary", span: "col-span-1 row-span-1" },
  { title: "Product", hint: "Macro · Commercial", span: "col-span-1 row-span-1" },
  { title: "Wedding", hint: "Story · Cinematic", span: "col-span-2 row-span-1" },
  { title: "Fashion", hint: "Look · Movement", span: "col-span-2 row-span-1" },
];

/**
 * Scroll-driven 3D camera hero. The section is 220vh tall with a sticky
 * inner viewport; a CSS-3D camera rotates from back-facing → screen-facing
 * and scales up so the screen (a bento of photography niches) covers the
 * viewport at the end of the scroll range.
 */
export function CreatorHero({ title, subtitle }: { title: string; subtitle: string | null; media: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const titleOpacity = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 0.6, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);

  // Camera: rotate from back (-180deg) to front (0deg), then keep front
  const rotateY = useTransform(scrollYProgress, [0, 0.55, 1], [-180, -10, 0]);
  // Grow from a compact camera in the corner to viewport-covering at the end
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [0.9, 1.1, 2.2]);
  const cameraY = useTransform(scrollYProgress, [0, 0.55, 1], [40, 0, -20]);

  return (
    <section
      ref={ref}
      className="relative isolate w-full"
      style={{ height: "220vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Background wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.93_0.05_75)_0%,_oklch(0.972_0.018_85)_60%)]" />

        {/* Title */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="pointer-events-none absolute inset-x-0 top-[10vh] z-10 mx-auto max-w-6xl px-6 text-center"
        >
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-6 max-w-xl font-body text-base text-foreground/70 md:text-lg">{subtitle}</p>
          )}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 font-body text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            scroll — power on the camera
          </div>
        </motion.div>

        {/* 3D camera stage */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1600px" }}>
          <motion.div
            className="relative"
            style={{
              rotateY,
              scale,
              y: cameraY,
              transformStyle: "preserve-3d",
              width: "min(78vw, 620px)",
              aspectRatio: "16 / 10",
            }}
          >
            <CameraBack />
            <CameraFront scrollYProgress={scrollYProgress} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CameraBack() {
  return (
    <div
      className="absolute inset-0 rounded-[22px] border border-black/20 shadow-2xl"
      style={{
        backfaceVisibility: "hidden",
        background:
          "linear-gradient(160deg, oklch(0.32 0.02 40) 0%, oklch(0.22 0.02 40) 55%, oklch(0.14 0.01 40) 100%)",
      }}
    >
      {/* Grip */}
      <div className="absolute -left-[6%] top-[10%] h-[80%] w-[12%] rounded-l-[22px] bg-black/70 shadow-inner" />
      {/* Lens */}
      <div className="absolute left-1/2 top-1/2 h-[70%] -translate-x-1/2 -translate-y-1/2 aspect-square rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, oklch(0.35 0.02 220) 0%, oklch(0.1 0.005 220) 55%, #000 100%)",
          boxShadow: "0 0 0 8px oklch(0.18 0.01 40), 0 0 0 10px oklch(0.28 0.02 40), inset 0 0 30px rgba(0,0,0,0.9)",
        }}
      >
        <div className="absolute inset-[18%] rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, oklch(0.55 0.08 220 / 0.7), transparent 60%), radial-gradient(circle at 70% 75%, oklch(0.63 0.14 40 / 0.5), transparent 55%), #000",
            boxShadow: "inset 0 0 20px rgba(255,255,255,0.15)",
          }}
        />
        <div className="absolute left-[22%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/25 blur-sm" />
      </div>
      {/* Top plate */}
      <div className="absolute left-[10%] right-[10%] top-[-6%] h-[10%] rounded-t-lg bg-black/80" />
      {/* Brand mark */}
      <div className="absolute bottom-3 right-4 font-heading text-[10px] uppercase tracking-[0.3em] text-white/40">
        alex — rivers
      </div>
    </div>
  );
}

function CameraFront({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Fade the screen contents in once the flip is essentially done
  const screenOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div
      className="absolute inset-0 rounded-[22px] border border-black/30 shadow-2xl"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        background:
          "linear-gradient(160deg, oklch(0.28 0.02 40) 0%, oklch(0.18 0.01 40) 60%, oklch(0.1 0.005 40) 100%)",
      }}
    >
      {/* Top control strip */}
      <div className="absolute inset-x-3 top-2 flex items-center justify-between text-[10px] text-white/60 font-mono-token">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> REC</span>
        <span>ISO 400 · f/1.8 · 1/250</span>
        <span>◐ 87%</span>
      </div>
      {/* Screen */}
      <motion.div
        style={{ opacity: screenOpacity }}
        className="absolute left-[5%] right-[5%] top-[12%] bottom-[10%] overflow-hidden rounded-lg border border-white/10"
      >
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(140deg, oklch(0.22 0.03 80) 0%, oklch(0.16 0.02 40) 100%)" }}
        />
        {/* Menu header */}
        <div className="relative flex items-center justify-between px-3 py-2 font-mono-token text-[10px] uppercase tracking-widest text-white/80">
          <span>menu · niches</span>
          <span>◄ ▲ ▼ ►</span>
        </div>
        {/* Bento */}
        <div className="relative grid h-[calc(100%-28px)] grid-cols-4 grid-rows-3 gap-1.5 p-2">
          {NICHES.map((n, i) => {
            const active = hovered === i;
            return (
              <button
                key={n.title}
                type="button"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered((h) => (h === i ? null : h))}
                className={`${n.span} group relative overflow-hidden rounded-md border text-left transition-all duration-300`}
                style={{
                  borderColor: active ? "oklch(0.85 0.16 40)" : "rgba(255,255,255,0.08)",
                  background: active
                    ? "linear-gradient(135deg, oklch(0.63 0.14 40 / 0.9), oklch(0.85 0.16 40 / 0.7))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  boxShadow: active ? "0 0 24px oklch(0.85 0.16 40 / 0.4)" : "none",
                }}
              >
                <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 4px)",
                  }}
                />
                <div className="relative flex h-full flex-col justify-between p-2">
                  <div className={`font-heading text-[13px] leading-none md:text-base ${active ? "text-white" : "text-white/85"}`}>
                    {n.title}
                  </div>
                  <div className={`font-mono-token text-[8px] uppercase tracking-widest md:text-[9px] ${active ? "text-white/90" : "text-white/55"}`}>
                    {n.hint}
                  </div>
                </div>
                {active && (
                  <span className="absolute right-1.5 top-1.5 font-mono-token text-[8px] text-white/90">◉ selected</span>
                )}
              </button>
            );
          })}
        </div>
        {/* Corner marks */}
        <div className="pointer-events-none absolute inset-2 border border-white/10" />
        <div className="pointer-events-none absolute left-3 top-3 h-2 w-2 border-l border-t border-white/40" />
        <div className="pointer-events-none absolute right-3 top-3 h-2 w-2 border-r border-t border-white/40" />
        <div className="pointer-events-none absolute left-3 bottom-3 h-2 w-2 border-l border-b border-white/40" />
        <div className="pointer-events-none absolute right-3 bottom-3 h-2 w-2 border-r border-b border-white/40" />
      </motion.div>
      {/* Buttons */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-white/25" />
        ))}
      </div>
    </div>
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
  return (
    <section className="py-20 md:py-28">
      <SectionHeader section={section} />
      <form
        onSubmit={(e) => { e.preventDefault(); alert("Thanks — I'll be in touch soon."); }}
        className="mx-auto grid max-w-2xl gap-4 px-6"
      >
        <input required name="name" placeholder="Your name" className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <input required type="email" name="email" placeholder="Email" className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <textarea required name="message" placeholder="What are you working on?" rows={5} className="rounded-md border border-border bg-card px-4 py-3 font-body text-sm focus:border-accent focus:outline-none" />
        <button type="submit" className="rounded-md bg-accent px-6 py-3 font-heading text-base text-accent-foreground transition hover:opacity-90">Send message</button>
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