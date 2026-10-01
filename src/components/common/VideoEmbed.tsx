import React, { useState } from "react";
import { Video, ExternalLink, Play, AlertCircle } from "lucide-react";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../../utils/videoUtils";

interface VideoEmbedProps {
  url?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "auto";
  autoPlay?: boolean;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  title = "Video",
  className = "",
  aspectRatio = "video",
}) => {
  const [loadError, setLoadError] = useState(false);

  if (!url || !url.trim()) return null;

  const trimmedUrl = url.trim();
  const ytEmbedUrl = getYouTubeEmbedUrl(trimmedUrl);
  const isYt = Boolean(ytEmbedUrl);

  const ratioClass = aspectRatio === "video" ? "aspect-video" : aspectRatio === "square" ? "aspect-square" : "";

  return (
    <div className={`overflow-hidden rounded-2xl bg-slate-950 shadow-md border border-slate-800 ${className}`}>
      <div className={`relative w-full ${ratioClass} flex items-center justify-center`}>
        {isYt && ytEmbedUrl && !loadError ? (
          <iframe
            src={ytEmbedUrl}
            title={title}
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setLoadError(true)}
          />
        ) : !isYt && !loadError ? (
          <video
            src={trimmedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
            onError={() => setLoadError(true)}
          >
            Brauzeringiz video formatini qo'llab-quvvatlamaydi.
          </video>
        ) : (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-300">Videoni to'g'ridan-to'g'ri ko'rsatib bo'lmadi.</p>
            <a
              href={trimmedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Brauzerda ochish
            </a>
          </div>
        )}
      </div>

      {/* Footer bar with external link */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium truncate max-w-[70%] text-slate-300">
          <Video className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <a
          href={trimmedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline shrink-0 font-medium ml-2"
        >
          <span>{isYt ? "YouTube'da ochish" : "Havolani ochish"}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
