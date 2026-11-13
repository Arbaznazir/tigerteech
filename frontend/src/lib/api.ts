/**
 * Browser: "" / "same" → same-origin (/api via Next rewrites or a gateway).
 * Server (RSC/SSR): always hit the Go API — relative URLs would hit Next itself.
 */
function resolveApiUrl(): string {
  const pub = process.env.NEXT_PUBLIC_API_URL;
  const internal = process.env.INTERNAL_API_URL?.replace(/\/$/, "");

  if (typeof window === "undefined") {
    if (internal) return internal;
    if (pub && pub !== "" && pub !== "same") return pub.replace(/\/$/, "");
    return "http://127.0.0.1:4000";
  }

  if (pub === undefined) return "http://localhost:4000";
  if (pub === "" || pub === "same") return "";
  return pub.replace(/\/$/, "");
}

const API_URL = resolveApiUrl();

export type ApiEnvelope<T> = { data: T; error: string | null };

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  // Catalog/prices must stay fresh — `cache: "no-store"` is enough (avoid custom
  // Cache-Control request headers; they force CORS preflight and were blocked).
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.error) {
    throw new Error(json.error || `API ${res.status}`);
  }
  return json.data as T;
}

export { API_URL };
