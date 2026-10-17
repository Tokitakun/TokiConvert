/**
 * Media Allowlist for TokiConvert
 * Restricts direct media downloads and proxy targets strictly to supported platforms
 * and verified public media repositories.
 */

import net from "node:net";

export const ALLOWED_MEDIA_DOMAINS = [
  // YouTube
  "youtube.com",
  "youtu.be",
  "googlevideo.com",
  "ytimg.com",
  "ymcdn.org",

  // Spotify
  "spotify.com",
  "spotifycdn.com",
  "scdn.co",

  // TikTok
  "tiktok.com",
  "tiktokcdn.com",
  "byteoversea.com",
  "ibytedtos.com",

  // Instagram
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",

  // Twitter / X
  "twitter.com",
  "x.com",
  "twimg.com",

  // Reddit
  "reddit.com",
  "redd.it",
  "redditmedia.com",

  // Bandcamp
  "bandcamp.com",
  "bcbits.com",

  // SoundCloud
  "soundcloud.com",
  "sndcdn.com",

  // File Storage Platforms
  "mediafire.com",
  "pixeldrain.com",
  "catbox.moe",
  "drive.google.com",
  "googleusercontent.com",

  // Verified Public Media Repositories (for direct media samples / open resources)
  "wikimedia.org",
  "archive.org",
  "githubusercontent.com",
] as const;

/**
 * Checks if a hostname belongs to the approved media domains allowlist.
 * Explicitly rejects IP addresses, localhost, and non-allowlisted domains.
 */
export function isAllowedMediaHost(hostname: string): boolean {
  if (!hostname || typeof hostname !== "string") return false;

  const h = hostname.toLowerCase().trim().replace(/\.$/, ""); // strip trailing DNS dot

  // Block any raw IP addresses (IPv4 or IPv6)
  if (net.isIP(h) !== 0) {
    return false;
  }

  // Block localhost and internal domain names
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return false;
  }

  // Must match exact domain or sub-domain with preceding dot
  return ALLOWED_MEDIA_DOMAINS.some(
    (domain) => h === domain || h.endsWith("." + domain)
  );
}

/**
 * Validates whether a media URL candidate is safe to be signed with an HMAC token.
 * Verifies protocol (http/https), port (80/443), hostname validity, and allowlist.
 */
export function isSafeMediaUrlToSign(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Only standard ports allowed
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      return false;
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return false;
    }
    return isAllowedMediaHost(parsed.hostname);
  } catch {
    return false;
  }
}
