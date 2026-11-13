"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  TicketPercent,
  Tags,
  FolderTree,
  Boxes,
  ShoppingBag,
  Users,
  MessageCircle,
  Settings,
} from "lucide-react";
import { AdminAlerts, useAdminNavBadges } from "@/components/AdminAlerts";
import { clearSession, getUser, type AdminUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/queries", label: "Queries", icon: MessageCircle },
  { href: "/users", label: "Users", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/product-details", label: "Product details", icon: Tags },
  { href: "/banners", label: "Banners", icon: ImageIcon },
  { href: "/deals", label: "Deals", icon: Percent },
  { href: "/promotions", label: "Promos & offers", icon: TicketPercent },
  { href: "/settings", label: "Platform settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const { pendingOrders, awaitingReply } = useAdminNavBadges();

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--forest)] text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--orange)]">
            Seller Panel
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-wide">Tigerteeh</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const badge =
              item.href === "/orders"
                ? pendingOrders
                : item.href === "/queries"
                  ? awaitingReply
                  : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition",
                  active
                    ? "bg-[var(--orange)] text-[var(--ink)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      active
                        ? "bg-[var(--ink)] text-white"
                        : "bg-[var(--orange)] text-[var(--ink)]"
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 px-4 py-4 lg:block">
          <p className="truncate text-xs text-white/60">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:text-[var(--orange)]"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 lg:px-8">
          <p className="hidden text-sm text-[var(--muted)] sm:block">
            Manage catalog, banners & deals
          </p>
          <div className="ml-auto flex items-center gap-2">
            <AdminAlerts />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide lg:hidden"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className="size-3.5" /> Out
            </button>
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
