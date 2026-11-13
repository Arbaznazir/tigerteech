"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LifeBuoy,
  MapPin,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { OrderCard } from "@/components/account/OrderCard";
import { ProfileEditor } from "@/components/account/ProfileEditor";
import { ShopperLocationPicker } from "@/components/account/ShopperLocationPicker";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";
import { lineUnitPrice } from "@/lib/cart";
import {
  fetchCustomerOrders,
  type CustomerOrder,
} from "@/lib/customer-orders";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import {
  listNotifications,
  listTickets,
  markNotificationRead,
  type AppNotification,
  type SupportTicket,
} from "@/lib/support";
import { useCart } from "@/lib/use-cart";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";

type Panel =
  | "profile"
  | "orders"
  | "cart"
  | "help"
  | "notifications"
  | "location";

const PANELS: Panel[] = [
  "profile",
  "orders",
  "cart",
  "help",
  "notifications",
  "location",
];

function isPanel(v: string | null): v is Panel {
  return Boolean(v && (PANELS as string[]).includes(v));
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-muted">
          Loading…
        </div>
      }
    >
      <AccountPageInner />
    </Suspense>
  );
}

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const cartCount = useStore((s) =>
    s.cart.reduce((sum, line) => sum + line.quantity, 0)
  );
  const { formatPrice } = useMoney();

  const tabParam = searchParams.get("tab");
  const [panel, setPanel] = useState<Panel>(() =>
    isPanel(tabParam) ? tabParam : "orders"
  );
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (isPanel(tabParam) && tabParam !== panel) setPanel(tabParam);
  }, [tabParam, panel]);

  useEffect(() => {
    if (!user) return;
    void listNotifications()
      .then((page) => setUnread(page.unread || 0))
      .catch(() => setUnread(0));
  }, [user, panel]);

  const selectPanel = (next: Panel) => {
    setPanel(next);
    const url = next === "orders" ? "/account" : `/account?tab=${next}`;
    router.replace(url, { scroll: false });
  };

  if (!hydrated || !user) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  const place = [user.address?.city, user.address?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container-site py-10 md:py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
            My Account
          </p>
          <h1 className="font-display text-4xl md:text-5xl">Hey, {user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <Button
          type="button"
          variant="white"
          className="border border-line"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Logout
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-line bg-paper p-5 md:sticky md:top-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-line bg-soft">
              {user.avatarUrl ? (
                <img
                  src={resolveMediaUrl(user.avatarUrl)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-display text-lg">
                  {user.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-muted">
                {user.phone || "No phone yet"}
              </p>
              {place ? (
                <p className="truncate text-[12px] text-muted">{place}</p>
              ) : null}
            </div>
          </div>
          <nav className="mt-5 space-y-1">
            <AccountNav
              icon={UserRound}
              label="Edit Profile"
              active={panel === "profile"}
              onClick={() => selectPanel("profile")}
            />
            <AccountNav
              icon={Package}
              label="My Orders"
              active={panel === "orders"}
              onClick={() => selectPanel("orders")}
            />
            <AccountNav
              icon={ShoppingBag}
              label="Cart"
              active={panel === "cart"}
              hint={cartCount ? `${cartCount}` : undefined}
              onClick={() => selectPanel("cart")}
            />
            <AccountNav
              icon={LifeBuoy}
              label="Need help"
              active={panel === "help"}
              onClick={() => selectPanel("help")}
            />
            <AccountNav
              icon={Bell}
              label="Notifications"
              active={panel === "notifications"}
              hint={unread ? `${unread}` : undefined}
              onClick={() => selectPanel("notifications")}
            />
            <AccountNav
              icon={MapPin}
              label="Shopping location"
              active={panel === "location"}
              onClick={() => selectPanel("location")}
            />
          </nav>
        </aside>

        <section className="min-w-0">
          {panel === "profile" ? <ProfileEditor /> : null}
          {panel === "orders" ? (
            <OrdersPanel formatPrice={formatPrice} />
          ) : null}
          {panel === "cart" ? <CartPanel /> : null}
          {panel === "help" ? <HelpPanel /> : null}
          {panel === "notifications" ? (
            <NotificationsPanel
              onUnreadChange={setUnread}
              onOpenHelp={() => selectPanel("help")}
            />
          ) : null}
          {panel === "location" ? <ShopperLocationPicker /> : null}
        </section>
      </div>
    </div>
  );
}

function AccountNav({
  icon: Icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: typeof UserRound;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
        active
          ? "bg-orange/15 text-ink"
          : "text-ink hover:bg-soft"
      )}
    >
      <Icon
        className={cn("size-4", active ? "text-orange" : "text-muted")}
        strokeWidth={2}
      />
      <span className="flex-1">{label}</span>
      {hint ? (
        <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold text-ink">
          {hint}
        </span>
      ) : null}
      <ChevronRight className="size-4 text-muted" />
    </button>
  );
}

function OrdersPanel({
  formatPrice,
}: {
  formatPrice: (n: number) => string;
}) {
  const user = useStore((s) => s.user);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const PAGE = 10;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const page = await fetchCustomerOrders(PAGE, offsetRef.current);
      setTotal(page.total);
      setOrders((prev) => {
        const seen = new Set(prev.map((order) => order.id));
        return [...prev, ...page.items.filter((order) => !seen.has(order.id))];
      });
      offsetRef.current += page.items.length;
      if (page.items.length === 0 || offsetRef.current >= page.total) {
        doneRef.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    offsetRef.current = 0;
    doneRef.current = false;
    setOrders([]);
    void loadMore();
  }, [user, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !user) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [user, loadMore, orders.length]);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Order History</h2>
          <p className="mt-1 text-sm text-muted">
            {total
              ? `${orders.length} of ${total} order${total === 1 ? "" : "s"}`
              : "Your orders"}
          </p>
        </div>
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      {loading && orders.length === 0 ? (
        <p className="text-sm text-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper p-8 text-center">
          <p className="text-muted">No orders yet.</p>
          <Button href="/shop" className="mt-4">
            Start Shopping
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              price={formatPrice(order.totals?.total ?? 0)}
            />
          ))}
        </ul>
      )}
      <div ref={sentinelRef} className="h-4" />
      {loading && orders.length > 0 ? (
        <p className="mt-3 text-center text-sm text-muted">Loading more…</p>
      ) : null}
    </div>
  );
}

function CartPanel() {
  const {
    hydrated,
    items,
    count,
    subtotal,
    shipping,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { formatPrice } = useMoney();
  const productTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of items) {
      totals[item.productId] =
        (totals[item.productId] || 0) + lineUnitPrice(item) * item.quantity;
    }
    return totals;
  }, [items]);

  if (!hydrated) {
    return <p className="text-sm text-muted">Loading bag…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-3xl">Your bag</h2>
        <p className="mt-2 text-sm text-muted">Nothing in the bag yet.</p>
        <Button href="/shop" className="mt-5">
          Shop the drop
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-3xl">Your bag</h2>
        <p className="mt-1 text-sm text-muted">
          {count} {count === 1 ? "look" : "looks"} ready to check out.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ul className="space-y-4">
          {items.map((item, index) => (
            <CartLineItem
              key={`${item.productId}-${item.size}-${item.color}`}
              item={item}
              index={index}
              formatPrice={formatPrice}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </ul>
        <CartSummary
          count={count}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          productIds={items.map((i) => i.productId)}
          productTotals={productTotals}
          formatPrice={formatPrice}
        />
      </div>
      <p className="mt-4 text-[12px] text-muted">
        Prefer the full bag page?{" "}
        <Link href="/cart" className="font-semibold text-orange">
          Open cart
        </Link>
      </p>
    </div>
  );
}

function HelpPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void listTickets()
      .then((page) => setTickets(page.items || []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load help")
      );
  }, []);

  return (
    <div>
      <h2 className="font-display text-3xl">Need help</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Open an order and choose Need help to message us about that purchase.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {tickets.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No help requests yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/account/help/${ticket.id}`}
                className="block rounded-2xl border border-line bg-paper p-4 transition hover:border-ink/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl">
                    {ticket.orderName || "Order"}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    {ticket.status === "resolved" ? "Resolved" : "Open"}
                  </span>
                </div>
                {ticket.preview ? (
                  <p className="mt-1 truncate text-sm text-muted">
                    {ticket.preview}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">No messages yet</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationsPanel({
  onUnreadChange,
  onOpenHelp,
}: {
  onUnreadChange: (n: number) => void;
  onOpenHelp: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    void listNotifications().then((page) => {
      setItems(page.items || []);
      onUnreadChange(page.unread || 0);
    });
  }, [onUnreadChange]);

  return (
    <div>
      <h2 className="font-display text-3xl">Notifications</h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nothing yet. Replies about your orders show up here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  void markNotificationRead(item.id).finally(() => {
                    setItems((prev) =>
                      prev.map((n) =>
                        n.id === item.id
                          ? { ...n, readAt: n.readAt || new Date().toISOString() }
                          : n
                      )
                    );
                    onUnreadChange(
                      Math.max(
                        0,
                        items.filter((n) => !n.readAt && n.id !== item.id).length
                      )
                    );
                    if (item.ticketId) {
                      router.push(`/account/help/${item.ticketId}`);
                      return;
                    }
                    if (item.orderId) {
                      const focus =
                        /measurement/i.test(item.title) ||
                        /measurement/i.test(item.body)
                          ? "?focus=measurements"
                          : /address/i.test(item.title) ||
                              /address/i.test(item.body)
                            ? "?focus=address"
                            : "";
                      router.push(`/account/orders/${item.orderId}${focus}`);
                      return;
                    }
                    onOpenHelp();
                  });
                }}
                className={cn(
                  "block w-full rounded-2xl border border-line p-4 text-left",
                  item.readAt ? "bg-paper" : "bg-orange/10"
                )}
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
                <p className="mt-2 text-[11px] text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
