import { AnimatePresence, motion } from "framer-motion";
import { useMode } from "@/lib/mode";

export function ModeTransition() {
  const { isTransitioning, reducedMotion } = useMode();
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
            <div className="absolute inset-0 bg-black" />
          ) : (
            <ApertureCurtain />
          )}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ApertureCurtain() {
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