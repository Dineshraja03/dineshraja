import { getCloudinarySignature } from "./cloudinary.functions";

/**
 * Uploads a file to Cloudinary (signed, admin-only) and returns the secure CDN URL.
 * Only the URL is stored in the database.
 */
export async function uploadToCloudinary(file: File, folder = "portfolio"): Promise<string> {
  const sig = await getCloudinarySignature({ data: { folder } });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message ?? "Cloudinary upload failed");
  }
  return json.secure_url;
}