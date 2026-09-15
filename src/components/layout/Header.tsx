"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  { href: "/shop/kids", label: "Kids" },
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
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
      <div
        className={cn(
          "relative border-b border-transparent bg-white/95 backdrop-blur-xl transition-[box-shadow,border-color] duration-300",
          scrolled &&
            "border-line/80 shadow-[0_8px_28px_rgba(6,35,26,0.08)]"
        )}
      >
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center px-3 sm:px-4 md:h-[80px] md:px-8 lg:px-10">
          {/* LEFT */}
          <div className="relative z-20 flex min-w-0 flex-1 items-center md:translate-y-[2px]">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full border border-forest/10 bg-soft text-forest transition active:scale-95 lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" strokeWidth={1.85} />
            </button>
            <nav className="hidden items-center gap-6 lg:flex xl:gap-7">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap text-[13px] font-medium text-[#1a1a1a] transition hover:text-[#f49331]",
                    isActive(item.href) && "font-semibold"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-0 -bottom-[6px] h-[2px] rounded-full bg-[#f49331]" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTER — logo */}
          <div className="relative z-30 flex w-[96px] shrink-0 justify-center sm:w-[110px] md:w-[130px]">
            <Link
              href="/"
              className="flex translate-y-[10px] items-center justify-center sm:translate-y-[8px] md:translate-y-[6px] lg:translate-y-[11px]"
              aria-label="Tigerteeh Clothing home"
            >
              <Image
                src="/brand-logo.png"
                alt="Tigerteeh Clothing"
                width={400}
                height={400}
                className="h-[78px] w-auto max-w-none object-contain sm:h-[92px] md:h-[120px] lg:h-[148px]"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* RIGHT */}
          <div className="relative z-20 flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:translate-y-[2px] md:gap-3">
            <form
              onSubmit={onSearch}
              className="hidden h-10 items-center rounded-full bg-[#f3f3f3] px-3.5 lg:flex lg:w-[180px] xl:w-[230px]"
            >
              <Search
                className="size-[17px] shrink-0 text-[#8a8a8a]"
                strokeWidth={1.75}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for outfits, sets..."
                className="ml-2 w-full bg-transparent text-[12px] outline-none placeholder:text-[#9a9a9a] xl:text-[13px]"
              />
            </form>

            <Link
              href="/search"
              className="flex size-10 items-center justify-center rounded-full bg-soft text-ink transition active:scale-95 lg:hidden"
              aria-label="Search"
            >
              <Search className="size-[18px]" strokeWidth={1.7} />
            </Link>

            <div className="hidden sm:block">
              <CurrencySwitcher />
            </div>

            <Link
              href={user ? "/account" : "/account/login"}
              className="hidden size-9 items-center justify-center transition hover:text-[#f49331] md:flex"
              aria-label="Account"
            >
              <User className="size-[20px]" strokeWidth={1.6} />
            </Link>

            <Link
              href="/wishlist"
              className="relative hidden size-10 items-center justify-center rounded-full transition hover:bg-soft hover:text-[#f49331] sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="size-[20px]" strokeWidth={1.6} />
              {hydrated && wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-[#f49331] text-[9px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative flex h-10 items-center gap-1.5 rounded-full bg-forest px-3.5 text-white shadow-sm transition active:scale-95 md:bg-transparent md:px-0 md:text-ink md:shadow-none md:hover:text-[#f49331]"
              aria-label="Cart"
            >
              <span className="relative inline-flex text-white md:text-inherit">
                <ShoppingBag
                  className="size-[18px] text-white md:size-[20px] md:text-current"
                  strokeWidth={1.7}
                />
                <span className="absolute -right-2 -top-2 flex size-[16px] items-center justify-center rounded-full bg-[#f49331] text-[9px] font-bold leading-none text-white">
                  {hydrated ? cartCount : 0}
                </span>
              </span>
              <span className="hidden text-[13px] font-semibold tabular-nums md:inline">
                {hydrated ? formatPrice(cartSubtotal) : formatPrice(0)}
              </span>
            </Link>
          </div>
        </div>
      </div>

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
