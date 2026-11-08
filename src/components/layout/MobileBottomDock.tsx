"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Home, Search, ShoppingBag, Store } from "lucide-react";
import { computeCartCount } from "@/lib/cart";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/shop",
    label: "Shop",
    icon: Store,
    match: (p: string) => p.startsWith("/shop") || p.startsWith("/product"),
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    match: (p: string) => p.startsWith("/search"),
  },
  {
    href: "/cart",
    label: "Bag",
    icon: ShoppingBag,
    match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout"),
  },
];

export function MobileBottomDock() {
  const pathname = usePathname();
  const cart = useStore((s) => s.cart);
  const hydrated = useStore((s) => s.hydrated);
  const cartCount = useMemo(() => computeCartCount(cart), [cart]);

  return (
    <nav
      aria-label="Mobile shortcuts"
      data-mobile-dock
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-1 rounded-[1.75rem] border border-line bg-paper/95 px-2 py-2 shadow-[0_12px_40px_rgba(22,20,18,0.18)] backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          const isBag = href === "/cart";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition",
                active
                  ? "bg-orange text-ink"
                  : "text-ink/75 active:bg-soft active:text-ink"
              )}
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "size-[18px]",
                    active ? "text-ink" : "text-ink/80"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {isBag && hydrated && cartCount > 0 && (
                  <span
                    className={cn(
                      "absolute -right-2.5 -top-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                      active
                        ? "bg-ink text-orange"
                        : "bg-orange text-white"
                    )}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.14em]",
                  active ? "text-ink" : "text-ink/75"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
