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
 * Get the embedded YouTube iframe URL with minimal controls
 * allowfullscreen, allow autoplay, allow encrypted-media
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=1`;
}
