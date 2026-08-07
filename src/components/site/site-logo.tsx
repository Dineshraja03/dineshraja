import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";

export function SiteLogo() {
  return (
    <Link
      to="/"
      className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-card/80 shadow-lg backdrop-blur transition hover:scale-105 hover:opacity-90 md:h-11 md:w-11"
      aria-label="Dinesh Raja — home"
    >
      <img
        src={logoAsset.url}
        alt="Dinesh Raja"
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
