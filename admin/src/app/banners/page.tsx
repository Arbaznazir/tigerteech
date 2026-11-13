"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { AmountInput } from "@/components/AmountInput";
import {
  BannerPreview,
  type BannerDraft,
} from "@/components/BannerPreview";
import { BannerPagePreview } from "@/components/BannerPagePreview";
import { Pagination, paginate } from "@/components/Pagination";
import { api, uploadFile } from "@/lib/api";
import { cn } from "@/lib/cn";

type Slot = {
  key: string;
  label: string;
  description: string;
  aspectHintDesktop: string;
  aspectHintMobile: string;
};

type Banner = {
  id: string;
  slotKey: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  objectPositionDesktop: string;
  objectPositionMobile: string;
  copy: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
};

const SCRIPT_PRESETS = [
  { label: "Top right", value: "right-[5%] top-[13%]" },
  { label: "Mid right", value: "right-[4%] top-[38%]" },
  { label: "Top left", value: "left-[5%] top-[16%]" },
  { label: "Bottom left", value: "left-[5%] bottom-[18%]" },
  { label: "Bottom right", value: "right-[5%] bottom-[18%]" },
];

const PAGE_SIZE = 6;

const emptyDraft = (slotKey = "hero"): BannerDraft => ({
  slotKey,
  title: "",
  subtitle: "",
  ctaLabel: slotKey === "promo_mid" ? "Explore Collection" : "Shop Now",
  ctaHref: "/shop",
  imageDesktopUrl: "",
  imageMobileUrl: "",
  objectPositionDesktop: "center",
  objectPositionMobile: "center",
  copy: {
    eyebrow: "",
    lead: "",
    accent: "",
    trail: "",
    subtitle: "",
    script: "",
    scriptPos: "right-[5%] top-[13%]",
    secondary: "",
    align: "left",
    lightVeil: false,
    words: "FASHION,COURAGE,FREEDOM,YOU",
  },
});

function bannerToDraft(b: Banner): BannerDraft {
  const c = (b.copy || {}) as Record<string, unknown>;
  const words = Array.isArray(c.words)
    ? (c.words as string[]).join(",")
    : String(c.words || "FASHION,COURAGE,FREEDOM,YOU");
  return {
    slotKey: b.slotKey,
    title: b.title || "",
    subtitle: b.subtitle || "",
    ctaLabel: b.ctaLabel || "Shop Now",
    ctaHref: b.ctaHref || "/shop",
    imageDesktopUrl: b.imageDesktopUrl || "",
    imageMobileUrl: b.imageMobileUrl || "",
    objectPositionDesktop: b.objectPositionDesktop || "center",
    objectPositionMobile: b.objectPositionMobile || "center",
    copy: {
      eyebrow: String(c.eyebrow || ""),
      lead: String(c.lead || ""),
      accent: String(c.accent || ""),
      trail: String(c.trail || ""),
      subtitle: String(c.subtitle || b.subtitle || ""),
      script: String(c.script || ""),
      scriptPos: String(c.scriptPos || "right-[5%] top-[13%]"),
      secondary: String(c.secondary || ""),
      align:
        c.align === "right" || c.align === "center" || c.align === "left"
          ? c.align
          : "left",
      lightVeil: Boolean(c.lightVeil),
      words,
    },
  };
}

function draftPayload(
  draft: BannerDraft,
  sortOrder: number,
  isActive: boolean,
  locked = false
) {
  const words = draft.copy.words
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const keepLocal = (url: string) =>
    url.startsWith("/images/") || url.startsWith("http") ? url : url;
  return {
    slotKey: draft.slotKey,
    title: draft.title || draft.copy.lead || "Banner",
    subtitle: draft.subtitle || draft.copy.subtitle,
    ctaLabel: draft.ctaLabel,
    ctaHref: draft.ctaHref,
    imageDesktopUrl: keepLocal(draft.imageDesktopUrl),
    imageMobileUrl: keepLocal(draft.imageMobileUrl),
    objectPositionDesktop: draft.objectPositionDesktop,
    objectPositionMobile: draft.objectPositionMobile,
    sortOrder,
    isActive,
    copy: {
      eyebrow: draft.copy.eyebrow,
      lead: draft.copy.lead,
      accent: draft.copy.accent,
      trail: draft.copy.trail,
      subtitle: draft.copy.subtitle || draft.subtitle,
      script: draft.copy.script,
      scriptPos: draft.copy.scriptPos,
      secondary: draft.copy.secondary,
      align: draft.copy.align,
      lightVeil: draft.copy.lightVeil,
      cta: draft.ctaLabel,
      words,
      locked,
    },
  };
}

function previewUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("/images/")) return `http://localhost:3000${url}`;
  return url;
}

function fieldLabel(children: React.ReactNode) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
      {children}
    </span>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[13px] outline-none transition focus:border-[var(--orange)] focus:bg-white";

export default function BannersPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [previewMode, setPreviewMode] = useState<"web" | "phone">("web");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [draft, setDraft] = useState<BannerDraft>(emptyDraft());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(
    null
  );
  const [page, setPage] = useState(1);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLFormElement>(null);

  async function load() {
    const [s, b] = await Promise.all([
      api<Slot[]>("/api/v1/admin/banner-slots"),
      api<Banner[]>("/api/v1/admin/banners"),
    ]);
    setSlots(s);
    setBanners(b);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const activeSlot = slots.find((s) => s.key === draft.slotKey);
  const isPromo = draft.slotKey === "promo_mid";
  const isHero = draft.slotKey === "hero";

  const slotBanners = useMemo(
    () =>
      [...banners.filter((b) => b.slotKey === draft.slotKey)].sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
    [banners, draft.slotKey]
  );

  useEffect(() => {
    setPage(1);
  }, [draft.slotKey]);

  function setCopy<K extends keyof BannerDraft["copy"]>(
    key: K,
    value: BannerDraft["copy"][K]
  ) {
    setDraft((d) => ({ ...d, copy: { ...d.copy, [key]: value } }));
  }

  function startNew() {
    setEditingId(null);
    setEditingLocked(false);
    setSortOrder(slotBanners.length);
    setIsActive(true);
    setDraft(emptyDraft(draft.slotKey));
  }

  function startEdit(b: Banner) {
    setEditingId(b.id);
    setEditingLocked(
      Boolean((b.copy as Record<string, unknown> | null)?.locked)
    );
    setSortOrder(b.sortOrder);
    setIsActive(b.isActive);
    setDraft(bannerToDraft(b));
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function uploadImage(file: File, which: "desktop" | "mobile") {
    setUploading(which);
    setError("");
    try {
      const { url } = await uploadFile(file, "banners");
      setDraft((d) =>
        which === "desktop"
          ? { ...d, imageDesktopUrl: url }
          : { ...d, imageMobileUrl: url }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft.imageDesktopUrl && !draft.imageMobileUrl) {
      setError("Upload at least a desktop or mobile image.");
      return;
    }
    setSaving(true);
    try {
      const body = draftPayload(draft, sortOrder, isActive, editingLocked);
      if (editingId) {
        await api(`/api/v1/admin/banners/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/v1/admin/banners", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      await load();
      if (!editingId) startNew();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const target = banners.find((b) => b.id === id);
    if ((target?.copy as Record<string, unknown> | null)?.locked) {
      setError("System banners are preloaded and cannot be deleted.");
      return;
    }
    if (!confirm("Delete this banner?")) return;
    try {
      await api(`/api/v1/admin/banners/${id}`, { method: "DELETE" });
      if (editingId === id) startNew();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const pageBanners = paginate(slotBanners, page, PAGE_SIZE);

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Banners</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Hero slides and Limited Collection promo. Click a saved preview to
            edit — live web/phone preview updates as you type.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="h-10 rounded-full border border-[var(--line)] bg-white px-4 text-[12px] font-semibold text-[var(--ink)] hover:border-[var(--orange)]"
        >
          + New banner
        </button>
      </div>

      {/* Saved banners with visual previews */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Saved banners
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              {activeSlot?.label || "Current slot"} — click a card to load it
              into the editor.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((s) => {
              const on = draft.slotKey === s.key;
              const count = banners.filter((b) => b.slotKey === s.key).length;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditingLocked(false);
                    setDraft(emptyDraft(s.key));
                    setSortOrder(
                      banners.filter((b) => b.slotKey === s.key).length
                    );
                    setIsActive(true);
                  }}
                  className={cn(
                    "h-8 rounded-lg border px-3 text-[12px] font-semibold transition",
                    on
                      ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--forest)]/35"
                  )}
                >
                  {s.label}
                  <span className="ml-1.5 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </header>

        {slotBanners.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
            No banners in this slot yet. Create one below.
          </p>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageBanners.map((b) => {
              const draftCard = bannerToDraft(b);
              const locked = Boolean(
                (b.copy as Record<string, unknown> | null)?.locked
              );
              const selected = editingId === b.id;
              return (
                <article
                  key={b.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-[var(--paper)] transition",
                    selected
                      ? "border-[var(--orange)] ring-2 ring-[var(--orange)]/25"
                      : "border-[var(--line)] hover:border-[var(--orange)]/50"
                  )}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => startEdit(b)}
                  >
                    <div className="pointer-events-none origin-top scale-[1] overflow-hidden bg-[var(--forest-deep)]">
                      <BannerPreview
                        draft={{
                          ...draftCard,
                          imageDesktopUrl: previewUrl(
                            draftCard.imageDesktopUrl
                          ),
                          imageMobileUrl: previewUrl(draftCard.imageMobileUrl),
                        }}
                        mode="web"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                          {b.title || draftCard.copy.lead || "Banner"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                          Order {b.sortOrder}
                          {b.isActive ? " · Active" : " · Hidden"}
                          {locked ? " · Preloaded" : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-[var(--orange)]">
                        Edit
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-3 py-2">
                    {!locked ? (
                      <button
                        type="button"
                        className="h-8 rounded-lg px-2.5 text-[12px] font-semibold text-[#b42318] hover:bg-red-50"
                        onClick={() => onDelete(b.id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                        Locked
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={slotBanners.length}
          onPageChange={setPage}
        />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          ref={editorRef}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                {editingId ? "Edit banner" : "New banner"}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {activeSlot?.description ||
                  "Images, copy, and placement for this slot."}
                {activeSlot
                  ? ` · Desktop ${activeSlot.aspectHintDesktop} · Mobile ${activeSlot.aspectHintMobile}`
                  : ""}
              </p>
            </header>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Images
                </p>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      [
                        "desktop",
                        "Desktop",
                        draft.imageDesktopUrl,
                        desktopRef,
                      ],
                      ["mobile", "Mobile", draft.imageMobileUrl, mobileRef],
                    ] as const
                  ).map(([which, label, url, ref]) => (
                    <div key={which}>
                      <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          await uploadImage(file, which);
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploading === which}
                        onClick={() => ref.current?.click()}
                        className={cn(
                          "relative flex aspect-[16/9] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-[var(--paper)] transition hover:border-[var(--orange)] disabled:opacity-60",
                          url ? "border-[var(--line)]" : "border-[var(--line)]"
                        )}
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl(url)}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <>
                            <span className="rounded-full bg-[var(--orange)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)]">
                              {uploading === which
                                ? "Uploading…"
                                : `Upload ${label}`}
                            </span>
                            <span className="mt-1.5 text-[10px] text-[var(--muted)]">
                              Optional if the other side is set
                            </span>
                          </>
                        )}
                        {url ? (
                          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {label}
                          </span>
                        ) : null}
                      </button>
                      {url ? (
                        <button
                          type="button"
                          className="mt-1.5 text-[11px] font-medium text-[var(--muted)] hover:text-[#b42318]"
                          onClick={() =>
                            setDraft((d) =>
                              which === "desktop"
                                ? { ...d, imageDesktopUrl: "" }
                                : { ...d, imageMobileUrl: "" }
                            )
                          }
                        >
                          Remove {label.toLowerCase()}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  {fieldLabel("Desktop crop")}
                  <input
                    className={inputClass}
                    placeholder="center 40%"
                    value={draft.objectPositionDesktop}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        objectPositionDesktop: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block">
                  {fieldLabel("Mobile crop")}
                  <input
                    className={inputClass}
                    placeholder="center 32%"
                    value={draft.objectPositionMobile}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        objectPositionMobile: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                Storefront text
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Overlay copy — matches the live hero / promo layout.
              </p>
            </header>

            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  {fieldLabel("Eyebrow")}
                  <input
                    className={inputClass}
                    value={draft.copy.eyebrow}
                    onChange={(e) => setCopy("eyebrow", e.target.value)}
                    placeholder={
                      isPromo ? "Limited Collection" : "Tigerteeh Clothing"
                    }
                  />
                </label>
                <label className="block">
                  {fieldLabel("Text side")}
                  <select
                    className={inputClass}
                    value={draft.copy.align}
                    onChange={(e) =>
                      setCopy(
                        "align",
                        e.target.value as BannerDraft["copy"]["align"]
                      )
                    }
                  >
                    <option value="left">Left</option>
                    {isPromo ? <option value="center">Center</option> : null}
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  {fieldLabel("Lead")}
                  <input
                    className={inputClass}
                    value={draft.copy.lead}
                    onChange={(e) => setCopy("lead", e.target.value)}
                    placeholder={isPromo ? "BUILT FOR" : "WEAR YOUR"}
                  />
                </label>
                <label className="block">
                  {fieldLabel("Accent")}
                  <input
                    className={inputClass}
                    value={draft.copy.accent}
                    onChange={(e) => setCopy("accent", e.target.value)}
                    placeholder={isPromo ? "THE BOLD" : "WILD"}
                  />
                </label>
                {isHero ? (
                  <label className="block">
                    {fieldLabel("Trail")}
                    <input
                      className={inputClass}
                      value={draft.copy.trail}
                      onChange={(e) => setCopy("trail", e.target.value)}
                      placeholder="SIDE"
                    />
                  </label>
                ) : (
                  <div />
                )}
              </div>

              <label className="block">
                {fieldLabel("Subtitle")}
                <textarea
                  className={cn(inputClass, "min-h-[72px] resize-y")}
                  value={draft.copy.subtitle}
                  onChange={(e) => setCopy("subtitle", e.target.value)}
                />
              </label>

              {isHero ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    {fieldLabel("Script accent")}
                    <input
                      className={inputClass}
                      value={draft.copy.script}
                      onChange={(e) => setCopy("script", e.target.value)}
                      placeholder="More Than Clothing"
                    />
                  </label>
                  <label className="block">
                    {fieldLabel("Script position")}
                    <select
                      className={inputClass}
                      value={draft.copy.scriptPos}
                      onChange={(e) => setCopy("scriptPos", e.target.value)}
                    >
                      {SCRIPT_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {isPromo ? (
                <label className="block">
                  {fieldLabel("Vertical words")}
                  <input
                    className={inputClass}
                    value={draft.copy.words}
                    onChange={(e) => setCopy("words", e.target.value)}
                    placeholder="FASHION,COURAGE,FREEDOM,YOU"
                  />
                </label>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  {fieldLabel("CTA label")}
                  <input
                    className={inputClass}
                    value={draft.ctaLabel}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ctaLabel: e.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  {fieldLabel("CTA link")}
                  <input
                    className={inputClass}
                    value={draft.ctaHref}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ctaHref: e.target.value }))
                    }
                  />
                </label>
              </div>

              {isHero ? (
                <button
                  type="button"
                  onClick={() => setCopy("lightVeil", !draft.copy.lightVeil)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-semibold transition",
                    draft.copy.lightVeil
                      ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  )}
                >
                  Light studio veil
                </button>
              ) : null}

              <div className="grid gap-3 border-t border-[var(--line)] pt-3 sm:grid-cols-2">
                <label className="block">
                  {fieldLabel("Sort order")}
                  <AmountInput
                    className={inputClass}
                    value={sortOrder}
                    placeholder="0"
                    onChange={setSortOrder}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-semibold transition",
                    isActive
                      ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  )}
                >
                  {isActive ? "Active on storefront" : "Hidden on storefront"}
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 shadow-[0_8px_30px_rgba(18,16,14,0.08)] backdrop-blur">
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update banner"
                  : "Save banner"}
            </button>
          </div>
        </form>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                  Live preview
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {editingId ? "Editing saved banner" : "Unsaved draft"}
                </p>
              </div>
              <div className="flex rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1">
                {(["web", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreviewMode(m)}
                    className={cn(
                      "h-8 rounded-md px-3 text-[11px] font-semibold uppercase tracking-wide",
                      previewMode === m
                        ? "bg-[var(--forest)] text-[var(--paper)]"
                        : "text-[var(--muted)]"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <BannerPagePreview
                draft={{
                  ...draft,
                  imageDesktopUrl: previewUrl(draft.imageDesktopUrl),
                  imageMobileUrl: previewUrl(draft.imageMobileUrl),
                }}
                mode={previewMode}
              />
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
