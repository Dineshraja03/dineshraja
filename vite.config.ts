import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Platform target. Vercel's build environment sets VERCEL; DEPLOY_TARGET can
// override locally. Defaults to Cloudflare (Pages) otherwise.
const target =
  process.env.DEPLOY_TARGET || (process.env.VERCEL ? "vercel" : "cloudflare");

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    target === "vercel"
      ? nitro()
      : cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(target === "cloudflare" ? { server: { entry: "server" } } : {}),
    viteReact(),
  ],
});
