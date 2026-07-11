import { AnimatePresence, motion } from "framer-motion";
import { useMode } from "@/lib/mode";

export function ModeTransition() {
  const { isTransitioning, reducedMotion, mode } = useMode();
  // While transitioning, `mode` has already flipped to the destination (see mode.tsx toggle).
  // developer destination = we're going creator → developer → show dev-style loader.
  // creator destination   = we're going developer → creator → show creator-style loader.
  const goingToDeveloper = mode === "developer";
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="mode-transition"
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.18 : 0.15 }}
          aria-hidden
        >
          {reducedMotion ? (
            <div className={`absolute inset-0 ${goingToDeveloper ? "bg-black" : "bg-[oklch(0.972_0.018_85)]"}`} />
          ) : goingToDeveloper ? (
            <ApertureCurtain bladeColor="#000" />
          ) : (
            <PaperCurtain />
          )}
          {goingToDeveloper ? (
            <motion.div
              className="relative z-10 font-mono-token text-sm md:text-base"
              style={{ color: "oklch(0.82 0.18 145)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0] }}
              transition={{ duration: reducedMotion ? 0.18 : 0.85, times: [0, 0.35, 0.45, 0.75, 1] }}
            >
              <span>&gt; loading dev.env...</span>
              <span className="cursor-blink ml-1">▊</span>
            </motion.div>
          ) : (
            <motion.div
              className="relative z-10 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0] }}
              transition={{ duration: reducedMotion ? 0.18 : 0.85, times: [0, 0.35, 0.45, 0.75, 1] }}
            >
              <ShutterMark />
              <span
                className="italic tracking-[0.2em] text-[13px] md:text-sm"
                style={{ color: "oklch(0.35 0.05 40)", fontFamily: "var(--font-serif)" }}
              >
                developing…
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ApertureCurtain({ bladeColor = "#000" }: { bladeColor?: string }) {
  const blades = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bladeColor }}>
      {blades.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] origin-center"
          style={{
            transform: `translate(-50%,-50%) rotate(${i * 60}deg)`,
            clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
            background: bladeColor,
          }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: [0.2, 1.05, 1.05, 0.2], opacity: [0.9, 1, 1, 0] }}
          transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1], ease: "easeInOut", delay: i * 0.015 }}
        />
      ))}
    </div>
  );
}

function PaperCurtain() {
  // Creator-style curtain: warm cream sheet that sweeps in and blurs/develops out.
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, oklch(0.98 0.02 85) 0%, oklch(0.94 0.03 75) 60%, oklch(0.88 0.05 65) 100%)",
        }}
        initial={{ clipPath: "inset(100% 0% 0% 0%)", opacity: 0.95 }}
        animate={{
          clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"],
          opacity: [0.95, 1, 1, 0],
        }}
        transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1], ease: [0.22, 1, 0.36, 1] }}
      />
      {/* film grain overlay */}
      <motion.div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          opacity: 0.15,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0.18, 0] }}
        transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1] }}
      />
    </div>
  );
}

function ShutterMark() {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className="h-10 w-10"
      initial={{ rotate: -30, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      fill="none"
      stroke="oklch(0.35 0.05 40)"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="18" />
      <path d="M24 6 L31 24" />
      <path d="M41 16 L24 24" />
      <path d="M41 32 L24 24" />
      <path d="M24 42 L17 24" />
      <path d="M7 32 L24 24" />
      <path d="M7 16 L24 24" />
    </motion.svg>
  );
}