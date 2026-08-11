# The Portfolio

Build a dual-mode personal portfolio website for a creative-technologist. The site has two

completely distinct visual modes toggled by a single switch in the top-right corner,

powered by Supabase for all content.



MODE SWITCH

- Icon that morphs between a camera-aperture icon (Creator/light mode) and a terminal

  cursor "<>" icon (Developer/dark mode).

- On switch, play a signature transition: an iris/aperture-blade wipe closes over the

  screen, a brief monospace "loading dev.env..." flash appears at full black, then the

  new mode's layout fades/develops in (photo-develop style fade for creator mode,

  terminal-boot style for developer mode). Keep it under ~900ms. Respect

  prefers-reduced-motion with a simple crossfade fallback.

- Persist the last selected mode in local state/localStorage.



CREATOR MODE (light, aesthetic)

- Fonts: an elegant serif/display font for headings (e.g. Fraunces or similar Google

  Font), clean humanist sans for body (e.g. General Sans / Inter).

- Palette: warm cream/off-white base, one warm accent color (terracotta or muted gold),

  subtle film-grain texture overlay.

- Layout: asymmetric editorial grid, generous whitespace, full-bleed hero video/image,

  masonry photography gallery, subtle scroll parallax.

- Sections: Hero (name + tagline + reel background), Photography (filterable masonry

  gallery), Videography (embedded video showreel + client work), Video Editing

  (before/after comparison slider), Graphic Design/UI-UX (case study cards), About/Studio,

  Testimonials, Contact form.



DEVELOPER MODE (dark, nerdy)

- Fonts: monospace for headings/labels (JetBrains Mono or Space Mono), technical sans

  for body (IBM Plex Sans).

- Palette: near-black background, terminal-green or amber accent, optional subtle

  scanline texture.

- Layout: sharp-edged grid, repo-card style project tiles, code-editor-style hover states.

- Sections: Hero (terminal window with typing animation like "> whoami"), Web Dev

  Projects (repo-card grid), DIY/Tech Experiments, Skills/Stack (visual tech badge grid

  or GitHub-heatmap-style activity grid), Contact (terminal-input-style form).



DATA MODEL (Supabase)

- sections: id, mode (creator/developer/both), key, title, order_index, is_visible

- section_items: id, section_id, title, subtitle, body, media_url, alt_text, tags[],

  order_index, link_url

- site_settings: id, mode, hero_title, hero_subtitle, hero_media_url, theme_overrides (jsonb)

- testimonials: id, client_name, quote, avatar_url, order_index

- All content is fetched dynamically — no hardcoded section content in the frontend.



ADMIN PANEL (auth-protected, single admin user via Supabase Auth)

- Dashboard to add/remove/reorder sections (drag-and-drop) per mode

- Generic form-based editor for section_items: title, subtitle, rich text body, image/video

  upload to Supabase Storage, required alt-text field, tags, link URL, order index

- Toggle visibility (draft vs published) per section and per item

- Edit site_settings per mode (hero copy, hero media, accent color/font overrides) via a

  simple theme customizer

- Testimonials manager (add/edit/remove client quotes)

- Live preview pane showing the public site reflecting unsaved/draft changes



TECH

- React + Tailwind + Framer Motion for animations

- Supabase for auth and database; Cloudinary for media storage

- Fully responsive, accessible (proper alt text, keyboard-navigable toggle, reduced-motion support)

- SEO meta fields editable per mode from admin panel

## Development

Requires [Bun](https://bun.sh) or Node.js 20+.

```sh
git clone <this-repository-url>
cd dineshraja
cp .env.example .env   # fill in your Supabase credentials
bun install
bun run dev
```

The app runs at `http://localhost:3000`.

## Deploy to Cloudflare

This app uses the official [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) for SSR on Cloudflare Workers/Pages.

1. Connect the repo in [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) or run `bun run deploy` locally
2. Build command: `bun run build`
3. Add env vars in Cloudflare dashboard (Settings → Variables):
   - **Build-time:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Runtime:** `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_*`

Lockfile: commit `bun.lock` after dependency changes — Cloudflare runs `bun install --frozen-lockfile`.


1. Create a Supabase project and copy credentials into `.env` (see `.env.example`).
2. Run migrations: `supabase db push` or apply SQL files in `supabase/migrations/` via the Supabase SQL editor.
3. Add Cloudinary credentials to `.env` (server-only; used for admin uploads).
4. Sign up via `/auth`, then grant admin access:

```sql
INSERT INTO user_roles (user_id, role) VALUES ('<your-auth-user-uuid>', 'admin');
```

