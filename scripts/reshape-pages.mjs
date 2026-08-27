import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reshape a Cloudflare Workers build (dist/server + dist/client) into a
// Cloudflare Pages build: static assets at the output root + a _worker.js
// (Pages Function) for SSR. Pages serves files at the root statically and
// invokes _worker.js for everything else.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const client = join(dist, "client");
const server = join(dist, "server");

if (!existsSync(client) || !existsSync(server)) {
  console.error("Expected dist/client and dist/server from `vite build`. Run `vite build` first.");
  process.exit(1);
}

// 1. Static assets (client build output) -> dist root.
cpSync(client, dist, { recursive: true, force: true });

// 2. Worker modules -> dist/__wassets (kept separate from client assets).
const serverAssets = join(server, "assets");
const wAssets = join(dist, "__wassets");
if (existsSync(serverAssets)) {
  mkdirSync(wAssets, { recursive: true });
  cpSync(serverAssets, wAssets, { recursive: true, force: true });
}

// 3. Worker entry -> dist/_worker.js, rewriting its ./assets imports.
let worker = readFileSync(join(server, "index.js"), "utf8");
worker = worker.split("./assets/").join("./__wassets/");
writeFileSync(join(dist, "_worker.js"), worker);

// 4. Remove the original Workers-shaped directories.
rmSync(server, { recursive: true, force: true });
rmSync(client, { recursive: true, force: true });

console.log("Reshaped dist/ for Cloudflare Pages (static root + _worker.js).");
