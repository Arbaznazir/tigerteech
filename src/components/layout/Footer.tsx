"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, PawPrint } from "lucide-react";

function SocialIg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SocialFb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function SocialYt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 12.2s0-3.2-.4-4.7c-.2-.8-.8-1.4-1.6-1.6C19.5 5.5 12 5.5 12 5.5s-7.5 0-9 .4c-.8.2-1.4.8-1.6 1.6C1 9 1 12.2 1 12.2s0 3.2.4 4.7c.2.8.8 1.4 1.6 1.6 1.5.4 9 .4 9 .4s7.5 0 9-.4c.8-.2 1.4-.8 1.6-1.6.4-1.5.4-4.7.4-4.7zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
    </svg>
  );
}

const info = [
  { href: "/ordering-tracking", label: "Ordering Tracking" },
  { href: "/delivery-information", label: "Delivery Information" },
  { href: "/faq", label: "FAQ" },
];

const useful = [
  { href: "/shipping-methods", label: "Shipping Methods" },
  { href: "/terms-condition", label: "Terms & Condition" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const cats = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop/women", label: "Women" },
  { href: "/shop/kids", label: "Kids" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  };

  return (
    <footer className="mt-auto bg-forest text-white">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Image
            src="/brand-logo.png"
            alt="Tigerteeh Clothing"
            width={200}
            height={200}
            className="mb-4 h-[76px] w-auto object-contain"
            unoptimized
          />
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            More Than Clothing. A Lifestyle.
          </p>
          <a
            href="mailto:support@tigerteehclothing.com"
            className="mt-3 inline-block text-sm text-white/80 transition hover:text-orange"
          >
            support@tigerteehclothing.com
          </a>
          <div className="mt-5 flex gap-3">
            {[SocialIg, SocialFb, SocialYt].map((Icon, i) => (
              <a
                key={i}
                href="https://tigerteehclothing.com/"
                target="_blank"
                rel="noreferrer"
                className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-orange hover:text-orange"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              Information
            </h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {info.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-orange">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              Useful Links
            </h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {useful.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-orange">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm text-white/70">
              {cats.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-orange">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">
            Join Our Tribe
          </h3>
          <p className="mb-4 text-sm text-white/70">
            Get drops, stories, and wild deals first.
          </p>
          <form
            onSubmit={onSubmit}
            className="flex overflow-hidden rounded-full border border-white/20 bg-white/5"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              className="flex size-11 items-center justify-center bg-orange text-white"
              aria-label="Subscribe"
            >
              <ArrowRight className="size-4" />
            </button>
          </form>
          {done && (
            <p className="mt-2 text-xs text-orange">You&apos;re on the list.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 sm:flex-row">
          <p>Copyright © {new Date().getFullYear()} Tigerteeh Clothing – All Rights Reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for the Bold
            <PawPrint className="size-3.5 text-orange" />
          </p>
        </div>
      </div>
    </footer>
  );
}
