import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const cache = new Map<string, string>();

/** Extracts the storage object path from any Supabase storage URL for the media bucket. */
export function storagePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?media\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Resolves stored media URLs to a working URL (signed URL for private bucket objects). */
export function useMediaUrl(url: string | null | undefined): string | null {
  const path = storagePath(url);
  const [resolved, setResolved] = useState<string | null>(() =>
    path ? (cache.get(path) ?? null) : (url ?? null),
  );

  useEffect(() => {
    if (!path) {
      setResolved(url ?? null);
      return;
    }
    const hit = cache.get(path);
    if (hit) {
      setResolved(hit);
      return;
    }
    let alive = true;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data }) => {
        if (!alive || !data?.signedUrl) return;
        cache.set(path, data.signedUrl);
        setResolved(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [path, url]);

  return resolved;
}

export function MediaImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const resolved = useMediaUrl(src);
  if (!resolved) return null;
  return <img src={resolved} {...rest} />;
}
