"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const login = useStore((s) => s.login);
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace(next);
  }, [hydrated, user, router, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await login(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(next);
  };

  return (
    <div className="container-site flex justify-center py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-8">
        <h1 className="font-display text-4xl">Login</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to checkout. Your cart stays with you after login.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password *</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            variant="forest"
            className="w-full rounded-md"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Login"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          No account yet?{" "}
          <Link
            href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-orange"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
