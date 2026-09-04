import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useMode } from "@/lib/mode";
import { portfolioQuery } from "@/lib/portfolio";
import { ModeSwitch } from "@/components/site/mode-switch";
import { ModeTransition } from "@/components/site/mode-transition";
import { SiteLogo } from "@/components/site/site-logo";
import { CreatorHero, CreatorSectionRenderer } from "@/components/site/creator-sections";
import { DeveloperHero, DeveloperSectionRenderer } from "@/components/site/developer-sections";
import { ModeBreaker } from "@/components/site/mode-breaker";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <div className="texture-overlay" aria-hidden />
      <SiteLogo />
      <ModeSwitch />
      <ModeTransition />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <SiteContent />
      </Suspense>
      <ModeBreaker />
      <SiteFooter />
    </>
  );
}

function SiteContent() {
  const { mode } = useMode();
  const { data } = useSuspenseQuery(portfolioQuery(mode));
  const { sections, items, testimonials, settings } = data;
  return (
    <main key={mode} className={mode === "creator" ? "animate-develop" : "animate-boot"}>
      {mode === "creator" ? (
        <CreatorHero title={settings?.hero_title ?? ""} subtitle={settings?.hero_subtitle ?? null} media={settings?.hero_media_url ?? null} mediaPc={settings?.hero_media_url_pc ?? null} mediaMobile={settings?.hero_media_url_mobile ?? null} />
      ) : (
        <DeveloperHero title={settings?.hero_title ?? ""} subtitle={settings?.hero_subtitle ?? null} />
      )}
      {sections.map((s) =>
        mode === "creator" ? (
          <CreatorSectionRenderer key={s.id} section={s} items={items} testimonials={testimonials} />
        ) : (
          <DeveloperSectionRenderer key={s.id} section={s} items={items} />
        ),
      )}
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 font-body text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-sm text-foreground">Dinesh Raja</p>
          <p className="mt-1">Photography, branding, and software experiments.</p>
        </div>
        <p>© {new Date().getFullYear()} · Built across two sides.</p>
      </div>
    </footer>
  );
}
