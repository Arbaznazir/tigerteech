/** Browser: same-origin via Caddy. Server: local Go API (relative would hit Next). */
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

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tt_admin_token");
}

export async function api<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (!(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.auth !== false) {
    const t = token();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  } catch {
    throw new Error("Connection error. Please try again.");
  }

  const text = await res.text();
  let json: ApiEnvelope<T> | null = null;
  try {
    json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    throw new Error(
      res.ok
        ? "Invalid response from server"
        : `Request failed (${res.status})`
    );
  }

  if (!res.ok || json?.error) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json!.data;
}

export async function uploadFile(file: File, entity = "misc") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("entity", entity);
  return api<{ url: string }>("/api/v1/admin/media", {
    method: "POST",
    body: fd,
  });
}

/** Supports legacy bare arrays and paginated `{ items, total }` payloads. */
export function unwrapItems<T>(data: T[] | { items?: T[]; total?: number } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items || [];
}

export function unwrapTotal(
  data: unknown[] | { items?: unknown[]; total?: number } | null | undefined
): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data.total === "number") return data.total;
  return data.items?.length || 0;
}

export { API_URL };
