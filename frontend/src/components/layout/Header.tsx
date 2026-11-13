"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { computeCartCount, computeCartSubtotal } from "@/lib/cart";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop/women", label: "Women" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);
  const cartCount = useMemo(() => computeCartCount(cart), [cart]);
  const cartSubtotal = useMemo(() => computeCartSubtotal(cart), [cart]);
  const { formatPrice } = useMoney();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("mobile-menu-open");
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("mobile-menu-open");
    };
  }, [open]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        initial={reduceMotion ? false : { y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative border-b transition-[background,box-shadow,border-color,backdrop-filter] duration-400",
          /* Mobile home: glass over hero until scroll */
          isHome && !scrolled
            ? "border-white/10 bg-paper/70 backdrop-blur-2xl md:border-transparent md:bg-paper/95"
            : "border-transparent bg-paper/95 backdrop-blur-xl",
          scrolled &&
            "border-line/80 bg-paper/98 shadow-[0_10px_32px_rgba(22,20,18,0.12)]"
        )}
      >
        <div className="mx-auto flex h-[56px] max-w-[1400px] items-center px-3.5 sm:px-4 md:h-[80px] md:px-8 lg:px-10">
          {/* LEFT */}
          <div className="relative z-20 flex min-w-0 flex-1 items-center md:translate-y-[2px]">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-[0_4px_14px_rgba(18,16,14,0.08)] transition active:scale-95 lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-[18px]" strokeWidth={1.85} />
            </button>
            <nav className="hidden items-center gap-6 lg:flex xl:gap-7">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap text-[13px] font-medium text-ink transition hover:text-orange",
                    isActive(item.href) && "font-semibold"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-0 -bottom-[6px] h-[2px] rounded-full bg-orange"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTER — logo */}
          <div className="relative z-30 flex w-[88px] shrink-0 justify-center sm:w-[110px] md:w-[130px]">
            <Link
              href="/"
              className="flex translate-y-[8px] items-center justify-center sm:translate-y-[8px] md:translate-y-[6px] lg:translate-y-[11px]"
              aria-label="Tigerteeh Clothing home"
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Image
                  src="/brand-logo.png"
                  alt="Tigerteeh Clothing"
                  width={400}
                  height={400}
                  className="h-[68px] w-auto max-w-none object-contain drop-shadow-sm sm:h-[92px] md:h-[120px] lg:h-[148px]"
                  priority
                  unoptimized
                />
              </motion.div>
            </Link>
          </div>

          {/* RIGHT */}
          <div className="relative z-20 flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:translate-y-[2px] md:gap-3">
            <form
              onSubmit={onSearch}
              className="hidden h-10 items-center rounded-full bg-soft px-3.5 lg:flex lg:w-[180px] xl:w-[230px]"
            >
              <Search
                className="size-[17px] shrink-0 text-muted"
                strokeWidth={1.75}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for outfits, sets..."
                className="ml-2 w-full bg-transparent text-[12px] outline-none placeholder:text-muted xl:text-[13px]"
              />
            </form>

            <Link
              href="/search"
              className="flex size-10 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-[0_4px_14px_rgba(18,16,14,0.08)] transition active:scale-95 lg:hidden"
              aria-label="Search"
            >
              <Search className="size-[17px]" strokeWidth={1.7} />
            </Link>

            <div className="hidden sm:block">
              <CurrencySwitcher />
            </div>

            <Link
              href={user ? "/account" : "/account/login"}
              className="hidden size-9 items-center justify-center transition hover:text-orange md:flex"
              aria-label="Account"
            >
              <User className="size-[20px]" strokeWidth={1.6} />
            </Link>

            <Link
              href="/wishlist"
              className="relative hidden size-10 items-center justify-center rounded-full transition hover:bg-soft hover:text-orange sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="size-[20px]" strokeWidth={1.6} />
              {hydrated && wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative flex size-10 items-center justify-center rounded-full bg-ink text-white shadow-[0_6px_16px_rgba(18,16,14,0.22)] transition active:scale-95 md:h-10 md:w-auto md:justify-start md:gap-1.5 md:bg-transparent md:px-0 md:text-ink md:shadow-none md:hover:text-orange"
              aria-label="Cart"
            >
              <span className="relative inline-flex text-white md:text-inherit">
                <ShoppingBag
                  className="size-[17px] text-white md:size-[20px] md:text-current"
                  strokeWidth={1.7}
                />
                <span className="absolute -right-2 -top-2 flex size-[16px] items-center justify-center rounded-full bg-orange text-[9px] font-bold leading-none text-ink">
                  {hydrated ? cartCount : 0}
                </span>
              </span>
              <span className="hidden text-[13px] font-semibold tabular-nums md:inline">
                {hydrated ? formatPrice(cartSubtotal) : formatPrice(0)}
              </span>
            </Link>
          </div>
        </div>
      </motion.div>

      <MobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        user={user}
        cartCount={hydrated ? cartCount : 0}
        wishlistCount={hydrated ? wishlist.length : 0}
      />
    </header>
  );
}
