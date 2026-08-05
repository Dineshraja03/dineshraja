import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Mode = "creator" | "developer";
const STORAGE_KEY = "portfolio.mode";

type ModeCtx = {
  mode: Mode;
  isTransitioning: boolean;
  toggle: () => void;
  setMode: (m: Mode) => void;
  reducedMotion: boolean;
};

const Ctx = createContext<ModeCtx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("creator");
  const [isTransitioning, setTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Mode | null;
      if (saved === "creator" || saved === "developer") setModeState(saved);
    } catch {}
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Reflect on <html data-mode>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const setMode = useCallback((next: Mode) => {
    setModeState((prev) => {
      if (prev === next) return prev;
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    const dur = reducedMotion ? 260 : 2000;
    setTransitioning(true);
    // swap mode near the mid-point so the reveal shows the new theme
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const half = reducedMotion ? 120 : 900;
    window.setTimeout(() => {
      setModeState((prev) => {
        const next = prev === "creator" ? "developer" : "creator";
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
        return next;
      });
    }, half);
    timerRef.current = window.setTimeout(() => setTransitioning(false), dur) as unknown as number;
  }, [reducedMotion]);

  const value = useMemo(() => ({ mode, isTransitioning, toggle, setMode, reducedMotion }), [mode, isTransitioning, toggle, setMode, reducedMotion]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMode() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMode must be inside ModeProvider");
  return v;
}