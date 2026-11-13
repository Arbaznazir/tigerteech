"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import {
  ArrowUpRight,
  BadgePercent,
  Boxes,
  FolderTree,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

type KPI = {
  products: number;
  activeProducts: number;
  categories: number;
  banners: number;
  deals: number;
  customers: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
  revenue7d: number;
  orders7d: number;
  avgOrderValue: number;
};

type NamedCount = { id: string; label: string; value: number };
type DayPoint = { day: string; orders: number; revenue: number };
type RecentOrder = {
  id: string;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  email: string;
  customerName: string;
  total: number;
  createdAt: string;
};

type DashboardStats = {
  kpi: KPI;
  ordersByStatus: NamedCount[];
  paymentMix: NamedCount[];
  revenueSeries: DayPoint[];
  recentOrders: RecentOrder[];
  rangeDays: number;
};

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const CHART = {
  orange: "#F38120",
  forest: "#161412",
  bark: "#3A3228",
  sand: "#C4A574",
  muted: "#6B6560",
  soft: "#F0EBE4",
  line: "#E5E0D8",
  paper: "#FAF9F7",
};

function money(n: number) {
  return `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function moneyExact(n: number) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function shortDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * i,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function DashboardPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await api<DashboardStats>(
        `/api/v1/admin/dashboard?days=${range}`
      );
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const kpi = stats?.kpi;

  const lineData = useMemo(() => {
    const series = stats?.revenueSeries || [];
    return [
      {
        id: "Revenue",
        color: CHART.orange,
        data: series.map((p) => ({ x: shortDay(p.day), y: p.revenue })),
      },
      {
        id: "Orders",
        color: CHART.bark,
        data: series.map((p) => ({ x: shortDay(p.day), y: p.orders })),
      },
    ];
  }, [stats]);

  const barData = useMemo(
    () =>
      (stats?.ordersByStatus || []).map((s) => ({
        status: s.label.replace("Order ", ""),
        count: s.value,
      })),
    [stats]
  );

  const pieData = useMemo(
    () =>
      (stats?.paymentMix || [])
        .filter((p) => p.value > 0)
        .map((p) => ({
          id: p.label,
          label: p.label,
          value: p.value,
          color: p.id === "online" ? CHART.orange : CHART.forest,
        })),
    [stats]
  );

  const kpis = [
    {
      label: "Revenue",
      value: money(kpi?.revenue || 0),
      hint: `${money(kpi?.revenue7d || 0)} last 7d`,
      href: "/orders",
      icon: ShoppingBag,
      accent: true,
    },
    {
      label: "Orders",
      value: String(kpi?.orders || 0),
      hint: `${kpi?.pendingOrders || 0} pending`,
      href: "/orders",
      icon: Package,
    },
    {
      label: "Customers",
      value: String(kpi?.customers || 0),
      hint: `AOV ${moneyExact(kpi?.avgOrderValue || 0)}`,
      href: "/users",
      icon: Users,
    },
    {
      label: "Catalog",
      value: String(kpi?.activeProducts || 0),
      hint: `${kpi?.products || 0} total · ${kpi?.categories || 0} cats`,
      href: "/products",
      icon: Boxes,
    },
  ];

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--orange)]"
          >
            Command center
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Dashboard
          </motion.h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Live sales pulse, order pipeline, and catalog health — animated with
            Nivo + Motion.
          </p>
        </div>

        <div className="flex rounded-xl border border-[var(--line)] bg-white p-1 shadow-[0_6px_20px_rgba(18,16,14,0.04)]">
          {RANGES.map((r) => {
            const active = days === r.days;
            return (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[12px] font-bold transition",
                  active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="dash-range"
                    className="absolute inset-0 rounded-lg bg-[var(--orange)]/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <span className="relative z-10">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <Link
                href={card.href}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-0.5",
                  card.accent
                    ? "border-[var(--forest)] bg-[linear-gradient(145deg,var(--forest)_0%,#2a241c_100%)] text-[var(--paper)] shadow-[0_18px_40px_rgba(18,16,14,0.22)]"
                    : "border-[var(--line)] bg-[var(--paper)] shadow-[0_8px_24px_rgba(18,16,14,0.05)] hover:border-[var(--orange)]/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                        card.accent ? "text-[var(--orange)]" : "text-[var(--muted)]"
                      )}
                    >
                      {card.label}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${card.label}-${card.value}-${loading}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.28 }}
                        className="mt-2 text-3xl font-semibold tracking-tight tabular-nums"
                      >
                        {loading && !kpi ? "—" : card.value}
                      </motion.p>
                    </AnimatePresence>
                    <p
                      className={cn(
                        "mt-1.5 text-[12px]",
                        card.accent ? "text-white/55" : "text-[var(--muted)]"
                      )}
                    >
                      {card.hint}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl transition",
                      card.accent
                        ? "bg-white/10 text-[var(--orange)]"
                        : "bg-[var(--soft)] text-[var(--forest)] group-hover:bg-[var(--orange)]/15 group-hover:text-[var(--orange)]"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={2.25} />
                  </span>
                </div>
                <ArrowUpRight
                  className={cn(
                    "absolute right-4 bottom-4 size-4 opacity-0 transition group-hover:opacity-100",
                    card.accent ? "text-[var(--orange)]" : "text-[var(--orange)]"
                  )}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_10px_30px_rgba(18,16,14,0.05)] md:p-5"
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Momentum
              </p>
              <h3 className="text-lg font-semibold tracking-tight">
                Revenue & orders
              </h3>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Last {days} days · spring-animated
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveLine
              key={`line-${days}-${stats?.revenueSeries?.length || 0}`}
              data={lineData}
              margin={{ top: 16, right: 18, bottom: 42, left: 44 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, stacked: false, nice: true }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 10,
                tickRotation: days > 30 ? -35 : 0,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: 5,
              }}
              colors={[CHART.orange, CHART.bark]}
              lineWidth={3}
              pointSize={8}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              enableArea
              areaOpacity={0.12}
              useMesh
              animate
              motionConfig="gentle"
              enableSlices="x"
              theme={{
                background: "transparent",
                text: { fill: CHART.muted, fontSize: 11, fontFamily: "inherit" },
                axis: {
                  ticks: {
                    text: { fill: CHART.muted, fontSize: 10 },
                  },
                },
                grid: { line: { stroke: CHART.line, strokeWidth: 1 } },
                crosshair: { line: { stroke: CHART.orange, strokeWidth: 1 } },
                tooltip: {
                  container: {
                    background: CHART.forest,
                    color: CHART.paper,
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 16px 40px rgba(18,16,14,0.25)",
                  },
                },
              }}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  translateY: 40,
                  itemWidth: 80,
                  itemHeight: 16,
                  symbolSize: 8,
                  symbolShape: "circle",
                },
              ]}
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_10px_30px_rgba(18,16,14,0.05)] md:p-5"
        >
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Pipeline
            </p>
            <h3 className="text-lg font-semibold tracking-tight">
              Orders by status
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveBar
              key={`bar-${days}-${barData.map((b) => b.count).join("-")}`}
              data={barData}
              keys={["count"]}
              indexBy="status"
              margin={{ top: 10, right: 8, bottom: 56, left: 36 }}
              padding={0.35}
              borderRadius={8}
              colors={[CHART.orange]}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 10,
                tickRotation: -28,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: 4,
              }}
              enableLabel={false}
              animate
              motionConfig="wobbly"
              theme={{
                background: "transparent",
                text: { fill: CHART.muted, fontSize: 11 },
                axis: {
                  ticks: { text: { fill: CHART.muted, fontSize: 10 } },
                },
                grid: { line: { stroke: CHART.line, strokeWidth: 1 } },
                tooltip: {
                  container: {
                    background: CHART.forest,
                    color: CHART.paper,
                    borderRadius: 12,
                    fontSize: 12,
                  },
                },
              }}
            />
          </div>
        </motion.section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_10px_30px_rgba(18,16,14,0.05)] md:p-5"
        >
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Checkout mix
            </p>
            <h3 className="text-lg font-semibold tracking-tight">
              COD vs online
            </h3>
          </div>
          <div className="h-[240px] w-full">
            {pieData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-[var(--muted)]">
                No orders yet — pie wakes up after the first sale.
              </div>
            ) : (
              <ResponsivePie
                key={`pie-${pieData.map((p) => p.value).join("-")}`}
                data={pieData}
                margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
                innerRadius={0.62}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={10}
                colors={{ datum: "data.color" }}
                borderWidth={0}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={16}
                arcLabelsTextColor={CHART.paper}
                animate
                motionConfig="gentle"
                theme={{
                  labels: {
                    text: { fontSize: 12, fontWeight: 700 },
                  },
                  tooltip: {
                    container: {
                      background: CHART.forest,
                      color: CHART.paper,
                      borderRadius: 12,
                      fontSize: 12,
                    },
                  },
                }}
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    translateY: 8,
                    itemWidth: 80,
                    itemHeight: 16,
                    symbolSize: 8,
                    symbolShape: "circle",
                  },
                ]}
              />
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_10px_30px_rgba(18,16,14,0.05)]"
        >
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] px-4 py-3.5 md:px-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Live feed
              </p>
              <h3 className="text-lg font-semibold tracking-tight">
                Recent orders
              </h3>
            </div>
            <Link
              href="/orders"
              className="text-[12px] font-bold text-[var(--orange)] hover:underline"
            >
              Open orders
            </Link>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {(stats?.recentOrders || []).length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                No orders yet. First checkout lights this up.
              </li>
            ) : (
              (stats?.recentOrders || []).map((o, i) => (
                <motion.li
                  key={o.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.35 }}
                >
                  <Link
                    href="/orders"
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--soft)]/60 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                        {o.customerName || o.email || "Customer"}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {new Date(o.createdAt).toLocaleString()} ·{" "}
                        {o.paymentMethod === "online" ? "Online" : "COD"} ·{" "}
                        {o.statusLabel}
                      </p>
                    </div>
                    <p className="shrink-0 text-[13px] font-bold tabular-nums">
                      {moneyExact(o.total)}
                    </p>
                  </Link>
                </motion.li>
              ))
            )}
          </ul>
        </motion.section>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            href: "/products",
            label: "Products",
            value: kpi?.products || 0,
            icon: Package,
          },
          {
            href: "/categories",
            label: "Categories",
            value: kpi?.categories || 0,
            icon: FolderTree,
          },
          {
            href: "/banners",
            label: "Banners",
            value: kpi?.banners || 0,
            icon: ImageIcon,
          },
          {
            href: "/deals",
            label: "Deals",
            value: kpi?.deals || 0,
            icon: BadgePercent,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-[var(--orange)]/45"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--soft)] text-[var(--forest)]">
                <Icon className="size-4" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {item.label}
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {item.value}
                </span>
              </span>
            </Link>
          );
        })}
      </motion.div>
    </Shell>
  );
}
