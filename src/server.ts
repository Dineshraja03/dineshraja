import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const captured = consumeLastCapturedError();
  // Dev SSR/HMR often aborts in-flight requests when the browser reconnects — not a real app error.
  if (isBenignAbort(captured) || (import.meta.env.DEV && !captured)) {
    return new Response(null, { status: 204 });
  }

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function isBenignAbort(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; cause?: unknown };
  if (e.code === "ECONNRESET" || e.message === "aborted") return true;
  if (e.cause) return isBenignAbort(e.cause);
  return false;
}

function buildContentSecurityPolicy(): string {
  const supabaseHost = (process.env.SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const supabaseSources = supabaseHost
    ? [`https://${supabaseHost}`, `wss://${supabaseHost}`]
    : ["https://*.supabase.co", "wss://*.supabase.co"];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
    "media-src 'self' blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    `connect-src 'self' https://api.cloudinary.com ${supabaseSources.join(" ")}`,
  ].join("; ");
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("content-security-policy", buildContentSecurityPolicy());
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("x-permitted-cross-domain-policies", "none");
  headers.set(
    "permissions-policy",
    "camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      if (!isBenignAbort(error)) console.error(error);
      if (isBenignAbort(error)) return new Response(null, { status: 204 });
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
