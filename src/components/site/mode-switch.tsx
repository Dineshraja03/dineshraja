import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMode } from "@/lib/mode";
import { useIsAdmin } from "@/lib/use-admin";

export function ModeSwitch() {
  const { mode, toggle, isTransitioning, reducedMotion } = useMode();
  const { data: isAdmin } = useIsAdmin();
  const isDev = mode === "developer";
  const phrase = isDev ? "Creator here" : "See my Dev side";

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-3">
      <div className="flex items-center gap-2">
        <Typewriter text={phrase} paused={isTransitioning || reducedMotion} isDev={isDev} />
        <button
          type="button"
          onClick={toggle}
          disabled={isTransitioning}
          aria-label={`Switch to ${isDev ? "creator" : "developer"} mode`}
          aria-pressed={isDev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-lg backdrop-blur transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 md:h-12 md:w-12"
        >
          <motion.div
            key={mode}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex h-6 w-6 items-center justify-center"
          >
            {isDev ? <ApertureIcon /> : <TerminalIcon />}
          </motion.div>
          <span className="sr-only">Toggle site mode</span>
        </button>
      </div>

      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center justify-center rounded-full border border-border bg-card/80 px-2 py-3 text-[11px] uppercase tracking-[0.25em] text-foreground shadow-lg backdrop-blur transition hover:bg-accent hover:text-accent-foreground md:px-2.5"
          style={{ writingMode: "vertical-rl" }}
        >
          Dashboard
        </Link>
      )}
    </div>
  );
}

function Typewriter({ text, paused, isDev }: { text: string; paused: boolean; isDev: boolean }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "hold" | "deleting">("typing");

  useEffect(() => { setCount(0); setPhase("typing"); }, [text]);

  useEffect(() => {
    if (paused) return;
    let delay = 70;
    if (phase === "hold") delay = 1400;
    if (phase === "deleting") delay = 40;
    const t = window.setTimeout(() => {
      if (phase === "typing") {
        if (count < text.length) setCount(count + 1);
        else setPhase("hold");
      } else if (phase === "hold") {
        setPhase("deleting");
      } else {
        if (count > 0) setCount(count - 1);
        else setPhase("typing");
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [count, phase, paused, text]);

  return (
    <AnimatePresence>
      <motion.span
        key={isDev ? "dev" : "creator"}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        aria-hidden
        className={`hidden select-none whitespace-nowrap rounded-full border border-border bg-card/70 px-3 py-1.5 backdrop-blur sm:inline-block ${
          isDev ? "font-mono-token text-xs text-accent" : "font-body text-xs italic text-foreground/80"
        }`}
      >
        {text.slice(0, count)}
        <span className="cursor-blink ml-0.5">▊</span>
      </motion.span>
    </AnimatePresence>
  );
}

function ApertureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L15.5 12" /><path d="M20.5 8 L12 12" /><path d="M20.5 16 L12 12" /><path d="M12 21 L8.5 12" /><path d="M3.5 16 L12 12" /><path d="M3.5 8 L12 12" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 7l4 5-4 5" />
      <path d="M11 17h9" />
    </svg>
  );
}
