import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { MediaImg } from "@/lib/media";
import { Play } from "lucide-react";

interface YouTubePlayerProps {
  videoId: string;
  thumbnailUrl?: string | null;
  title: string;
  className?: string;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

/**
 * Click-to-play YouTube embed facade
 * Shows a custom thumbnail until clicked, then loads the actual YouTube iframe
 * This approach:
 * - Gives 100% control over the UI until playback
 * - Avoids showing YouTube branding and suggested videos until clicked
 * - Improves page load performance (no YouTube JS until needed)
 * - Is the industry standard for professional sites
 */
export function YouTubePlayer({ videoId, thumbnailUrl, title, className, isPlaying, onPlayingChange }: YouTubePlayerProps) {
  if (isPlaying) {
    return (
      <div className={className}>
        <iframe
          src={getYouTubeEmbedUrl(videoId, true)}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  // Facade: show custom thumbnail with play button
  return (
    <button
      onClick={() => onPlayingChange(true)}
      className={`group relative bg-black text-white transition-transform hover:scale-[1.02] active:scale-95 ${className}`}
      aria-label={`Play video: ${title}`}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <MediaImg
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-900 to-black" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:bg-white group-hover:shadow-2xl">
          <Play className="h-8 w-8 fill-black text-black ml-1" />
        </div>
      </div>
    </button>
  );
}
