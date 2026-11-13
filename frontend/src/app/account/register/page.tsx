"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  isValidEmailFormat,
  validateEmailWithServer,
} from "@/lib/email";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const register = useStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [emailOk, setEmailOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const showConfirm = password.length > 0;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailHint("");
      setEmailOk(null);
      return;
    }
    if (!isValidEmailFormat(trimmed)) {
      setEmailOk(false);
      setEmailHint("Enter a valid email address");
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void validateEmailWithServer(trimmed).then((res) => {
        if (cancelled) return;
        setEmailOk(res.ok);
        setEmailHint(res.message);
      });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [email]);

  const canSubmit =
    name.trim().length > 0 &&
    (gender === "male" || gender === "female") &&
    isValidEmailFormat(email) &&
    emailOk !== false &&
    password.length >= 6 &&
    showConfirm &&
    passwordsMatch &&
    !busy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidEmailFormat(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (gender !== "male" && gender !== "female") {
      setError("Please select your gender");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const check = await validateEmailWithServer(email);
    if (!check.ok) {
      setEmailOk(false);
      setEmailHint(check.message);
      setError(check.message);
      return;
    }
    setBusy(true);
    const err = await register(name.trim(), email.trim(), password, {
      confirmPassword,
      gender,
    });
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
        <h1 className="font-display text-4xl">Register</h1>
        <p className="mt-2 text-sm text-muted">
          Create an account. Guest cart items stay after you sign up.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5 outline-none transition focus:border-orange"
              autoComplete="name"
            />
          </label>
          <fieldset className="block text-sm">
            <legend className="mb-1.5 block font-medium">Gender *</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["male", "Male"],
                  ["female", "Female"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-semibold transition",
                    gender === value
                      ? "border-orange bg-orange/10 text-ink"
                      : "border-line bg-paper text-muted hover:border-orange/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              Used as the default for your measurement sets. You can still save
              both male and female sets for gifts.
            </p>
          </fieldset>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 outline-none transition",
                emailOk === false
                  ? "border-red-400 focus:border-red-500"
                  : emailOk
                    ? "border-emerald-400 focus:border-emerald-500"
                    : "border-line focus:border-orange"
              )}
              autoComplete="email"
              inputMode="email"
            />
            {emailHint ? (
              <p
                className={cn(
                  "mt-1.5 flex items-start gap-1.5 text-[12px]",
                  emailOk ? "text-emerald-700" : "text-red-600"
                )}
              >
                {emailOk ? (
                  <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                ) : (
                  <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                )}
                {emailHint}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted">
                Use a permanent address (Gmail, Yahoo, Outlook…). Temp mail is
                blocked.
              </p>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password *</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!e.target.value) setConfirmPassword("");
              }}
              className="w-full rounded-lg border border-line px-3 py-2.5 outline-none transition focus:border-orange"
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-[11px] text-muted">
              At least 6 characters.
            </p>
          </label>
          {showConfirm ? (
            <label className="block animate-[fadeIn_0.25s_ease] text-sm">
              <span className="mb-1 block font-medium">Confirm password *</span>
              <input
                required
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 outline-none transition",
                  passwordsMismatch
                    ? "border-red-400 focus:border-red-500"
                    : passwordsMatch
                      ? "border-emerald-400 focus:border-emerald-500"
                      : "border-line focus:border-orange"
                )}
                autoComplete="new-password"
              />
              {passwordsMismatch ? (
                <p className="mt-1.5 text-[12px] text-red-600">
                  Passwords do not match
                </p>
              ) : passwordsMatch ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-emerald-700">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  Passwords match
                </p>
              ) : null}
            </label>
          ) : null}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            variant="forest"
            className="w-full rounded-md"
            disabled={!canSubmit}
          >
            {busy ? "Creating…" : "Register"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Have an account?{" "}
          <Link
            href={`/account/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-orange"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-muted">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
