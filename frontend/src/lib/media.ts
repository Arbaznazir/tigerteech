import { API_URL } from "@/lib/api";

function sameOriginApi(): boolean {
  const pub = process.env.NEXT_PUBLIC_API_URL;
  return pub === "" || pub === "same";
}

/** Strip loopback API host so ngrok/Caddy can serve /uploads on the public origin. */
function toUploadsPath(url: string): string | null {
  try {
    if (url.startsWith("/uploads/")) return url;
    if (!/^https?:\/\//i.test(url)) return null;
    const u = new URL(url);
    if (!u.pathname.startsWith("/uploads/")) return null;
    const loopback =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname.endsWith(".ngrok-free.dev") ||
      u.hostname.endsWith(".ngrok-free.app") ||
      u.hostname.endsWith(".ngrok.app");
    // Always prefer path for our own upload hosts when browser is same-origin.
    if (loopback || sameOriginApi()) return `${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return null;
}

/** Turn API-relative upload paths into absolute URLs the storefront can load. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const uploadsPath = toUploadsPath(trimmed);
  if (uploadsPath) {
    if (sameOriginApi()) return uploadsPath;
    // Localhost mode: point at the Go API host.
    const base = (API_URL || "http://localhost:4000").replace(/\/$/, "");
    // Don't prefix loopback absolute URLs into HTML during SSR when public is same —
    // handled above. For normal localhost:
    if (base.includes("127.0.0.1") && sameOriginApi()) return uploadsPath;
    return `${base}${uploadsPath}`;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    if (sameOriginApi()) return trimmed;
    return `${(API_URL || "http://localhost:4000").replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

export function isRemoteMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.includes("/uploads/")
  );
}
