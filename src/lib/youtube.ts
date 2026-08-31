/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  // youtu.be/ID
  let match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([a-zA-Z0-9_-]{11})/);
  if (match?.[1]) return match[1];

  // youtube.com/watch?v=ID&other_params
  match = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (match?.[1]) return match[1];

  return null;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Get the embedded YouTube iframe URL with minimal controls and privacy settings
 * - youtube-nocookie.com: no cookies until user clicks play, fewer consent popups
 * - rel=0: no related videos from other channels at end (was fully disabled pre-2018)
 * - modestbranding=1: smaller YouTube logo (can't be removed per Google ToS)
 * - iv_load_policy=3: disables annotations/cards
 * - controls=1: show player controls
 * - playsinline=1: inline playback on mobile (no fullscreen auto-enter)
 * - fs=1: fullscreen button enabled
 * - quality=highres: request highest resolution (YouTube will auto-select if not available)
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay: boolean = false): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    controls: "1",
    playsinline: "1",
    fs: "1",
    quality: "highres",
  });

  if (autoplay) params.append("autoplay", "1");

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
