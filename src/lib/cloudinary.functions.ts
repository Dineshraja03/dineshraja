import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function parseCloudinaryUrl(raw: string) {
  // cloudinary://<api_key>:<api_secret>@<cloud_name>
  const m = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) throw new Error("CLOUDINARY_URL is malformed");
  if (/[<>]/.test(raw)) throw new Error("CLOUDINARY_URL still contains placeholder values");
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3].replace(/\/.*$/, "") };
}

async function sha1Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns a short-lived signature so the browser can upload straight to Cloudinary. */
export const getCloudinarySignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder?: string }) => ({ folder: data?.folder ?? "portfolio" }))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!roles) throw new Error("Forbidden");

    const raw = process.env["CLOUDINARY_URL"];
    if (!raw) throw new Error("CLOUDINARY_URL is not configured");
    const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(raw);

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${data.folder}&timestamp=${timestamp}`;
    const signature = await sha1Hex(`${toSign}${apiSecret}`);

    return { cloudName, apiKey, timestamp, folder: data.folder, signature };
  });