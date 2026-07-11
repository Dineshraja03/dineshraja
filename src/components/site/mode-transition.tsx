import { AnimatePresence, motion } from "framer-motion";
import { useMode } from "@/lib/mode";

export function ModeTransition() {
  const { isTransitioning, transitionTo, reducedMotion } = useMode();
  const toCreator = transitionTo === "creator";
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
            <div className={`absolute inset-0 ${toCreator ? "bg-[oklch(0.972_0.018_85)]" : "bg-black"}`} />
          ) : toCreator ? (
            <CreatorCurtain />
          ) : (
            <DeveloperCurtain />
          )}
          {toCreator ? (
            <motion.div
              className="relative z-10 font-heading italic text-2xl md:text-4xl tracking-tight"
              style={{ color: "oklch(0.24 0.02 40)" }}
              initial={{ opacity: 0, filter: "blur(12px)" }}
              animate={{ opacity: [0, 0, 1, 1, 0], filter: ["blur(12px)", "blur(12px)", "blur(0px)", "blur(0px)", "blur(6px)"] }}
              transition={{ duration: reducedMotion ? 0.18 : 0.85, times: [0, 0.35, 0.45, 0.75, 1] }}
            >
              developing…
            </motion.div>
          ) : (
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeveloperCurtain() {
  const blades = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {blades.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] origin-center bg-black"
          style={{
            transform: `translate(-50%,-50%) rotate(${i * 60}deg)`,
            clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
          }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: [0.2, 1.05, 1.05, 0.2], opacity: [0.9, 1, 1, 0] }}
          transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1], ease: "easeInOut", delay: i * 0.015 }}
        />
      ))}
    </div>
  );
}

/**
 * Creator-side transition: warm cream aperture blooms open like a shutter
 * on a bright day, then a soft light-leak sweeps across as it dissolves.
 * The mood is film/photography — not terminal.
 */
function CreatorCurtain() {
  const blades = Array.from({ length: 8 });
  const cream = "oklch(0.972 0.018 85)";
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: cream }}>
      {/* Warm light bloom */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.9 0.14 70 / 0.9) 0%, oklch(0.972 0.018 85 / 0.6) 40%, oklch(0.972 0.018 85 / 0) 70%)",
          filter: "blur(20px)",
        }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1, 1.1, 1.6], opacity: [0, 0.9, 0.9, 0] }}
        transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1], ease: "easeInOut" }}
      />
      {/* Aperture blades that close then open */}
      {blades.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] origin-center"
          style={{
            transform: `translate(-50%,-50%) rotate(${i * 45}deg)`,
            clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
            backgroundColor: cream,
            boxShadow: "inset 0 0 40px oklch(0.63 0.14 40 / 0.25)",
          }}
          initial={{ scale: 1.05, opacity: 1 }}
          animate={{ scale: [1.05, 0.15, 0.15, 1.05], opacity: [1, 1, 1, 0] }}
          transition={{ duration: 0.85, times: [0, 0.35, 0.65, 1], ease: "easeInOut", delay: i * 0.012 }}
        />
      ))}
      {/* Light leak sweep */}
      <motion.div
        className="absolute inset-y-0 -left-1/3 w-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.85 0.16 40 / 0.4) 40%, oklch(0.972 0.018 85 / 0.7) 60%, transparent 100%)",
          filter: "blur(30px)",
        }}
        initial={{ x: "-40vw", opacity: 0 }}
        animate={{ x: ["-40vw", "40vw", "140vw"], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.85, times: [0, 0.55, 1], ease: "easeOut" }}
      />
    </div>
  );
}