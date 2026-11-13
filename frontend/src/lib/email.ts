import { API_URL } from "@/lib/api";

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** Quick client-side format check before hitting the API. */
export function isValidEmailFormat(email: string): boolean {
  const v = email.trim();
  if (!v || v.length > 254) return false;
  return EMAIL_RE.test(v);
}

export type EmailCheckResult = {
  ok: boolean;
  message: string;
};

export async function validateEmailWithServer(
  email: string
): Promise<EmailCheckResult> {
  const trimmed = email.trim();
  if (!isValidEmailFormat(trimmed)) {
    return { ok: false, message: "Enter a valid email address" };
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/validate-email`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: trimmed }),
    });
    const json = (await res.json()) as {
      data?: EmailCheckResult;
      error?: string | null;
    };
    if (!res.ok || json.error) {
      return { ok: false, message: json.error || "Could not verify email" };
    }
    return {
      ok: Boolean(json.data?.ok),
      message: json.data?.message || (json.data?.ok ? "OK" : "Invalid email"),
    };
  } catch {
    // Soft-fail on network — register will still enforce server-side.
    return { ok: true, message: "" };
  }
}
