import { motion } from "framer-motion";
import { useMode } from "@/lib/mode";

export function ModeBreaker() {
  const { mode, toggle, isTransitioning, reducedMotion } = useMode();
  const nextMode = mode === "creator" ? "developer" : "creator";

  return (
    <section className="border-y border-border bg-card/40 py-10 md:py-14">
      <button
        type="button"
        onClick={toggle}
        disabled={isTransitioning}
        aria-label={`Switch to ${nextMode} mode`}
        className="group relative mx-auto block w-full max-w-5xl overflow-hidden border border-dashed border-accent/60 px-6 py-8 text-left transition hover:border-accent hover:bg-accent/5 disabled:cursor-wait"
      >
        <span className="pointer-events-none absolute inset-0 mode-breaker-noise opacity-30" aria-hidden />
        <span className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <span>
            <span className="block font-mono-token text-xs uppercase tracking-[0.3em] text-accent">{mode} // boundary</span>
            <span className="mt-2 block font-heading text-3xl md:text-5xl">Break the surface.</span>
          </span>
          <span className="font-mono-token text-xs text-muted-foreground group-hover:text-foreground">click to enter {nextMode} mode <motion.span animate={reducedMotion ? undefined : { x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>-&gt;</motion.span></span>
        </span>
      </button>
    </section>
  );
}
