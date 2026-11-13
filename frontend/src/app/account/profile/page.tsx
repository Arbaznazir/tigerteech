"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileEditor } from "@/components/account/ProfileEditor";
import { useStore } from "@/lib/store";

export default function EditProfilePage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  return (
    <div className="container-site max-w-2xl py-10 md:py-14">
      <Link
        href="/account"
        className="text-[12px] font-semibold uppercase tracking-wide text-muted"
      >
        Account
      </Link>
      <div className="mt-4">
        <ProfileEditor />
      </div>
    </div>
  );
}
