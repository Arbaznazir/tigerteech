"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const register = useStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = register(name, email, password);
    if (err) {
      setError(err);
      return;
    }
    router.push("/account");
  };

  return (
    <div className="container-site flex justify-center py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-8">
        <h1 className="font-display text-4xl">Register</h1>
        <p className="mt-2 text-sm text-muted">
          Create a demo account saved in localStorage.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
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
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="forest" className="w-full rounded-md">
            Register
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Have an account?{" "}
          <Link href="/account/login" className="font-semibold text-orange">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
