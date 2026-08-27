import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reshape a Cloudflare Workers build (dist/server + dist/client) into a
// Cloudflare Pages build. Pages serves files from the output directory, but a
// root _worker.js (Advanced Mode) takes over ALL requests and must forward
// static assets to the ASSETS binding itself, falling back to SSR otherwise.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const client = join(dist, "client");
const server = join(dist, "server");

if (!existsSync(client) || !existsSync(join(server, "index.js"))) {
  console.error("Expected dist/client and dist/server/index.js from `vite build`. Run `vite build` first.");
  process.exit(1);
}

// 1. Static assets (client build output) -> dist root (served by the ASSETS binding).
cpSync(client, dist, { recursive: true, force: true });

// 2. Keep the bundled worker + its modules at dist/server (its ./assets imports
//    resolve within dist/server/assets).
// 3. Root _worker.js: serve static assets via env.ASSETS, otherwise SSR.
const workerWrapper = `import worker from "./server/index.js";

export default {
  async fetch(request, env, ctx) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      try {
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp && assetResp.status !== 404) return assetResp;
      } catch {}
    }
    return worker.fetch(request, env, ctx);
  },
};
`;
writeFileSync(join(dist, "_worker.js"), workerWrapper);

// 4. client/ was copied to the root; remove the original folder.
rmSync(client, { recursive: true, force: true });

console.log("Reshaped dist/ for Cloudflare Pages (static root + _worker.js with ASSETS fallback).");
