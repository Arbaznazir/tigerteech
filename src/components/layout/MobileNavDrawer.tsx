"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, ShoppingBag, User, X } from "lucide-react";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Home", match: "exact" as const },
  { href: "/shop/men", label: "Men", match: "prefix" as const },
  { href: "/shop/women", label: "Women", match: "prefix" as const },
  { href: "/shop", label: "Shop All", match: "exact" as const },
  { href: "/about", label: "About", match: "prefix" as const },
  { href: "/contact", label: "Contact", match: "prefix" as const },
];

type Props = {
  open: boolean;
  onClose: () => void;
  pathname: string;
  user: { id: string; name: string; email: string } | null;
  cartCount: number;
  wishlistCount: number;
};

export function MobileNavDrawer({
  open,
  onClose,
  pathname,
  user,
  cartCount,
  wishlistCount,
}: Props) {
  const isActive = (href: string, match: "exact" | "prefix") =>
    match === "exact" ? pathname === href : pathname.startsWith(href);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/55"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="absolute inset-y-0 left-0 flex w-full max-w-[360px] flex-col bg-forest text-white shadow-[24px_0_60px_rgba(0,0,0,0.45)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <Link href="/" onClick={onClose} className="flex items-center gap-3">
                <Image
                  src="/brand-logo.png"
                  alt="Tigerteeh"
                  width={48}
                  height={48}
                  className="h-11 w-auto object-contain"
                  unoptimized
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-orange">
                    Tigerteeh
                  </p>
                  <p className="font-display text-lg tracking-wide text-white">
                    Menu
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex size-10 items-center justify-center rounded-full bg-paper text-ink transition active:scale-95"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
              <ul className="space-y-1.5">
                {nav.map((item, i) => {
                  const active = isActive(item.href, item.match);
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.035 }}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3.5 transition",
                          active
                            ? "bg-orange"
                            : "bg-transparent active:bg-white/10"
                        )}
                      >
                        <span
                          className={cn(
                            "font-display text-[1.65rem] leading-none tracking-[0.04em]",
                            active ? "text-ink" : "text-white"
                          )}
                        >
                          {item.label}
                        </span>
                        <ArrowRight
                          className={cn(
                            "size-4 shrink-0",
                            active ? "text-ink" : "text-white/40"
                          )}
                          strokeWidth={2.25}
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-7 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Currency
                </p>
                <CurrencySwitcher align="left" tone="dark" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      href: user ? "/account" : "/account/login",
                      label: "Account",
                      icon: User,
                      badge: 0,
                    },
                    {
                      href: "/wishlist",
                      label: "Wishlist",
                      icon: Heart,
                      badge: wishlistCount,
                    },
                    {
                      href: "/cart",
                      label: "Bag",
                      icon: ShoppingBag,
                      badge: cartCount,
                    },
                  ] as const
                ).map(({ href, label, icon: Icon, badge }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={onClose}
                    className="relative flex flex-col items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-3.5 text-center transition active:bg-white/12"
                  >
                    <Icon className="size-5 text-orange" strokeWidth={1.85} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                      {label}
                    </span>
                    {badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-ink">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer CTA — clears home indicator; no clash with bottom dock */}
            <div className="border-t border-white/10 px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange text-[13px] font-bold uppercase tracking-[0.12em] text-ink transition active:scale-[0.98]"
              >
                Shop the drop
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              <p className="mt-2.5 text-center text-[11px] text-white/45">
                Wear the Wild. Live the Bold.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
