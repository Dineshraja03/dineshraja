import { createHash } from "node:crypto";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [
      ...(!cloudName ? ["CLOUDINARY_CLOUD_NAME"] : []),
      ...(!apiKey ? ["CLOUDINARY_API_KEY"] : []),
      ...(!apiSecret ? ["CLOUDINARY_API_SECRET"] : []),
    ];
    throw new Error(`Missing Cloudinary environment variable(s): ${missing.join(", ")}`);
  }

  return { cloudName, apiKey, apiSecret };
}

function signUploadParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "portfolio";
  const signature = signUploadParams({ folder, timestamp }, apiSecret);
  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudinary upload failed: ${body || response.statusText}`);
  }

  const result = (await response.json()) as { secure_url?: string };
  if (!result.secure_url) throw new Error("Cloudinary upload did not return a URL");
  return result.secure_url;
}
