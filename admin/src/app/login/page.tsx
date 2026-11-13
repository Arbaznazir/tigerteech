"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession, type AdminUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@tigerteehclothing.com");
  const [password, setPassword] = useState("TigerteehAdmin1!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<{ token: string; user: AdminUser }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password }),
        }
      );
      if (data.user.role !== "admin") {
        throw new Error("Admin access required");
      }
      saveSession(data.token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--forest-deep)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--forest)] p-8 text-white shadow-2xl"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--orange)]">
          Tigerteeh
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Seller login</h1>
        <p className="mt-2 text-sm text-white/65">
          Manage products, banners, deals, and orders.
        </p>

        <label className="mt-8 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[var(--orange)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Password
          <input
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[var(--orange)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[var(--orange)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[var(--ink)] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
