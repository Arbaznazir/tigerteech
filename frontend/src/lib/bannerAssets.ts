/** Built-in homepage banner files that ship with the storefront. */
const LOCAL_BANNER_FILES = new Set([
  "hero_desktop_1.webp",
  "hero_desktop_2.webp",
  "hero_desktop_3.webp",
  "hero_mobile_1.webp",
  "hero_mobile_2.webp",
  "hero_mobile_3.webp",
  "promo.webp",
]);

/**
 * Prefer local `/images/banners/*` for the seeded assets so Next/Image
 * never depends on the API optimizer for the default hero/promo photos.
 */
export function resolveBannerImage(url: string | undefined | null, fallback = ""): string {
  if (!url) return fallback;
  if (url.startsWith("/images/")) return url;

  const file = url.split("/").pop()?.split("?")[0] || "";
  if (LOCAL_BANNER_FILES.has(file)) {
    return `/images/banners/${file}`;
  }
  return url;
}

export function isRemoteImage(url: string) {
  return /^https?:\/\//i.test(url);
}

export const HERO_PRELOAD_IMAGES = [
  "/images/banners/hero_desktop_1.webp",
  "/images/banners/hero_desktop_2.webp",
  "/images/banners/hero_desktop_3.webp",
  "/images/banners/hero_mobile_1.webp",
  "/images/banners/hero_mobile_2.webp",
  "/images/banners/hero_mobile_3.webp",
] as const;
