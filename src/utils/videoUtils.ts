/**
 * Video & YouTube utility helpers
 * Supports standard URLs, youtu.be shortlinks, shorts, mobile, embed, iframe snippets, and timestamps.
 */

/**
 * Extracts a YouTube Video ID (11 chars) from any YouTube URL or iframe embed code.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // If user pasted full iframe tag: <iframe src="https://www.youtube.com/embed/xyz" ...
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const textToTest = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  // Handles:
  // - youtu.be/ID
  // - youtube.com/embed/ID
  // - youtube.com/v/ID
  // - youtube.com/shorts/ID
  // - youtube.com/watch?v=ID
  // - youtube.com/watch?...&v=ID
  // - m.youtube.com/watch?v=ID
  // - youtube-nocookie.com/embed/ID
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/,
  ];

  for (const pattern of patterns) {
    const match = textToTest.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Returns a clean YouTube embed URL suitable for <iframe>.
 */
export function getYouTubeEmbedUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  // Extract start time if present: ?t=120 or &t=120 or ?t=45s
  let startParam = "";
  const timeMatch = input.match(/[?&]t=(\d+)(?:s)?/i);
  if (timeMatch && timeMatch[1]) {
    startParam = `&start=${timeMatch[1]}`;
  }

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${startParam}`;
}

/**
 * Extracts all YouTube links found inside an arbitrary text block.
 */
export function extractYouTubeUrls(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const urlRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"']+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Checks if a given URL is a YouTube video.
 */
export function isYouTubeUrl(url: string): boolean {
  return Boolean(extractYouTubeVideoId(url));
}
