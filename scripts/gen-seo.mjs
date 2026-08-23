import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = (process.env.VITE_SITE_URL || "https://dineshraja.com").replace(/\/$/, "");

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

mkdirSync(resolve(root, "public"), { recursive: true });
writeFileSync(resolve(root, "public", "robots.txt"), robots);
writeFileSync(resolve(root, "public", "sitemap.xml"), sitemap);
console.log(`Generated public/robots.txt and public/sitemap.xml for ${siteUrl}`);
