import { useMode } from "@/lib/mode";
import { motion } from "framer-motion";

export function ModeSwitch() {
  const { mode, toggle, isTransitioning } = useMode();
  const isDev = mode === "developer";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isTransitioning}
      aria-label={`Switch to ${isDev ? "creator" : "developer"} mode`}
      aria-pressed={isDev}
      className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-lg backdrop-blur transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 md:h-12 md:w-12"
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