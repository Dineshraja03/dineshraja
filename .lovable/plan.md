# Dual-Mode Portfolio Plan

A single site with two distinct visual identities toggled by a top-right switch, all content driven by Supabase, with an auth-protected admin panel.

## Scope of first build

Given the size, I'll build this in one coherent pass but flag what's V1 vs polish:

**V1 (this build):**
- Both modes fully styled with distinct typography, palettes, layouts
- Mode-switch with aperture-wipe + "loading dev.env..." + develop-in transition (reduced-motion fallback)
- All public sections rendering from Supabase
- Admin panel: auth, sections CRUD + reorder, section_items CRUD w/ image upload, testimonials, site_settings editor, visibility toggle, SEO fields
- Seed data so both modes look complete on first load

**Deferred polish (call out after):**
- Live preview pane iframe in admin (will ship a "View site" link + auto-refresh on save instead; full split-pane preview is a follow-up)
- Rich-text editor (V1 uses textarea with markdown; can upgrade to TipTap later)
- Before/after slider + masonry filtering are included but simple

## Data model

```
sections(id, mode: 'creator'|'developer'|'both', key, title, order_index, is_visible)
section_items(id, section_id fk, title, subtitle, body, media_url, alt_text, tags text[], order_index, link_url, is_visible, meta jsonb)
site_settings(id, mode unique, hero_title, hero_subtitle, hero_media_url, seo_title, seo_description, theme_overrides jsonb)
testimonials(id, client_name, quote, avatar_url, order_index, is_visible)
user_roles(user_id, role: 'admin') -- for admin gate
```
RLS: public SELECT of visible rows for anon; full CRUD for admin role. Storage bucket `media` (public read, admin write).

## Routes

```
/                    → public site (mode from localStorage)
/auth                → sign in (admin only; no sign-up UI)
/_authenticated/admin        → dashboard
/_authenticated/admin/sections
/_authenticated/admin/items
/_authenticated/admin/testimonials
/_authenticated/admin/settings
```

## Design system (src/styles.css)

Two token sets swapped via `data-mode="creator"` / `data-mode="developer"` on `<html>`:
- Creator: cream `oklch(0.97 0.02 80)`, terracotta accent `oklch(0.62 0.14 40)`, Fraunces + Inter, film-grain overlay
- Developer: near-black `oklch(0.12 0.01 260)`, terminal green `oklch(0.78 0.18 145)`, JetBrains Mono + IBM Plex Sans, scanline overlay

Fonts loaded via `<link>` in `__root.tsx` head (per Tailwind v4 rules).

## Mode-switch transition

Framer Motion sequence, ~850ms total:
1. Aperture SVG blades close (250ms)
2. Full black + "> loading dev.env..." typewriter flash (300ms)
3. Blades open revealing new mode (300ms), content fades/develops in
Reduced-motion: 200ms crossfade only.

## Sections implemented

**Creator:** Hero (full-bleed media + serif tagline), Photography (masonry with tag filter), Videography (video embeds grid), Editing (before/after slider component), Design (case-study cards), About, Testimonials, Contact form.

**Developer:** Hero (terminal window with typed `> whoami` → bio), Projects (repo-card grid with lang color + stars-style meta), Experiments (card grid), Stack (badge grid), Contact (terminal-input form).

All rendered by mapping `sections` → generic renderer that picks a component per `section.key`.

## Admin panel

- Sidebar nav, table views for each entity
- Sections page: drag-and-drop reorder (dnd-kit), toggle visibility, mode filter
- Items editor: form with image upload to Supabase Storage, alt-text required
- Settings: per-mode hero + SEO + accent color picker (writes to theme_overrides jsonb, applied as CSS vars at runtime)
- Testimonials: simple list editor

## Tech details

- TanStack Start + TanStack Query already in template
- Server functions for admin writes with `requireSupabaseAuth` + `has_role` check
- Public reads via server publishable client with narrow `TO anon` policies
- Framer Motion for transitions, dnd-kit for reorder, zod for validation
- SEO: `head()` per route pulls `site_settings.seo_*` for current mode

## After enable

Enable Lovable Cloud, run migration with tables + RLS + grants + storage bucket + seed data, then build the UI. I'll ask for the admin email after Cloud is on so I can grant the admin role.

Ready to proceed?