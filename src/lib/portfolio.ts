import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Mode } from "./mode";

export type Section = {
  id: string;
  mode: "creator" | "developer" | "both";
  key: string;
  title: string;
  subtitle: string | null;
  order_index: number;
  is_visible: boolean;
};

export type SectionItem = {
  id: string;
  section_id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  media_url: string | null;
  media_url_secondary: string | null;
  alt_text: string | null;
  tags: string[];
  order_index: number;
  link_url: string | null;
  is_visible: boolean;
  meta: Record<string, unknown>;
};

export type SiteSettings = {
  id: string;
  mode: "creator" | "developer" | "both";
  hero_title: string;
  hero_subtitle: string | null;
  hero_media_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  theme_overrides: Record<string, unknown>;
};

export type Testimonial = {
  id: string;
  client_name: string;
  client_title: string | null;
  quote: string;
  avatar_url: string | null;
  order_index: number;
  is_visible: boolean;
};

export const portfolioQuery = (mode: Mode, opts?: { includeHidden?: boolean }) =>
  queryOptions({
    queryKey: ["portfolio", mode, opts?.includeHidden ?? false],
    queryFn: async () => {
      const includeHidden = opts?.includeHidden ?? false;
      const [sectionsQ, settingsQ, testimonialsQ] = await Promise.all([
        supabase.from("sections").select("*").in("mode", [mode, "both"]).order("order_index"),
        supabase.from("site_settings").select("*").eq("mode", mode).maybeSingle(),
        supabase.from("testimonials").select("*").order("order_index"),
      ]);
      if (sectionsQ.error) throw sectionsQ.error;
      if (settingsQ.error) throw settingsQ.error;
      if (testimonialsQ.error) throw testimonialsQ.error;
      const sections = ((sectionsQ.data as Section[]) ?? []).filter((s) => includeHidden || s.is_visible);
      const sectionIds = sections.map((s) => s.id);
      let items: SectionItem[] = [];
      if (sectionIds.length) {
        const itemsQ = await supabase.from("section_items").select("*").in("section_id", sectionIds).order("order_index");
        if (itemsQ.error) throw itemsQ.error;
        items = ((itemsQ.data as unknown as SectionItem[]) ?? []).filter((i) => includeHidden || i.is_visible);
      }
      const testimonials = ((testimonialsQ.data as Testimonial[]) ?? []).filter((t) => includeHidden || t.is_visible);
      return {
        sections,
        items,
        settings: (settingsQ.data as unknown as SiteSettings | null) ?? null,
        testimonials,
      };
    },
  });

export function itemsFor(items: SectionItem[], sectionId: string) {
  return items.filter((i) => i.section_id === sectionId);
}