"use client";

import { useMemo, useState } from "react";
import { GenderFitMark } from "@/components/GenderFitMark";
import { useStaggeredImageIndex } from "@/hooks/useStaggeredImageIndex";
import { cn } from "@/lib/cn";
import { buildSwatchCss, type ColorStyle } from "@/lib/colorSwatch";

export type PreviewVariant = {
  colorName: string;
  colorStyle: ColorStyle;
  colorHex: string;
  colorHex2: string;
};

export type PreviewAttribute = {
  label: string;
  value: string;
};

export type PreviewHighlightTag = {
  label: string;
  accent?: string;
};

export type PreviewMaterial = {
  name: string;
  price: number;
  colors: string[];
};

type Props = {
  mode: "web" | "phone";
  name: string;
  priceLabel: string;
  description?: string;
  imageUrl: string;
  imageUrls?: string[];
  badge?: string;
  genderFit?: string;
  variants: PreviewVariant[];
  attributes?: PreviewAttribute[];
  highlightTags?: PreviewHighlightTag[];
  materials?: PreviewMaterial[];
};

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#F0EBE4"/><text x="50%" y="50%" fill="#6B6560" font-family="Arial" font-size="16" text-anchor="middle">Upload image</text></svg>`
  );

const NEIGHBORS = [
  {
    key: "abc",
    name: "ABC Co-ord Set",
    price: "$89",
    images: [
      "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3A3228"/><stop offset="1" stop-color="#161412"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><text x="50%" y="48%" fill="#C4A574" font-family="Arial" font-size="42" font-weight="700" text-anchor="middle">ABC</text><text x="50%" y="56%" fill="#6B6560" font-family="Arial" font-size="14" text-anchor="middle">PLACEHOLDER</text></svg>`
        ),
    ],
    colors: ["#3A3228", "#C4A574"],
  },
  {
    key: "xyz",
    name: "XYZ Jungle Set",
    price: "$96",
    images: [
      "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F38120"/><stop offset="1" stop-color="#161412"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><text x="50%" y="48%" fill="#FAF9F7" font-family="Arial" font-size="42" font-weight="700" text-anchor="middle">XYZ</text><text x="50%" y="56%" fill="#F0EBE4" font-family="Arial" font-size="14" text-anchor="middle">PLACEHOLDER</text></svg>`
        ),
    ],
    colors: ["#F38120", "#161412"],
  },
];

function accentClass(accent?: string) {
  switch (accent) {
    case "green":
      return "bg-emerald-100 text-emerald-900";
    case "gold":
      return "bg-amber-100 text-amber-950";
    case "rose":
      return "bg-rose-100 text-rose-900";
    case "ink":
      return "bg-[var(--ink)]/10 text-[var(--ink)]";
    default:
      return "bg-[var(--soft)] text-[var(--ink)]";
  }
}

function MiniCard({
  name,
  price,
  images,
  colors,
  badge,
  genderFit,
  highlight,
  compact,
  onOpen,
}: {
  name: string;
  price: string;
  images: string[];
  colors: string[];
  badge?: string;
  genderFit?: string;
  highlight?: boolean;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const gallery = images.length ? images : [PLACEHOLDER];
  const imageIndex = useStaggeredImageIndex(gallery.length, gallery.length > 1);

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-[var(--paper)] shadow-sm",
        highlight
          ? "border-[var(--orange)] ring-2 ring-[var(--orange)]/35"
          : "border-[var(--line)]",
        compact && "scale-[0.98]",
        onOpen && "cursor-pointer transition hover:-translate-y-0.5"
      )}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="relative aspect-[2/3] bg-[var(--soft)]">
        {gallery.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover object-top transition-opacity duration-700",
              i === imageIndex ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        {badge ? (
          <span className="absolute left-2 top-2 z-[1] rounded-full bg-[var(--ink)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        ) : null}
        {highlight ? (
          <span className="absolute right-2 top-2 z-[1] rounded-full bg-[var(--orange)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[var(--ink)]">
            Yours
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="size-3.5 rounded-full border border-black/10"
                style={{ background: c }}
              />
            ))}
          </div>
          <GenderFitMark fit={genderFit || "unisex"} size="sm" />
        </div>
        <p className="line-clamp-2 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase leading-tight tracking-wide text-[var(--ink)]">
          {name}
        </p>
        <p className="text-[11px] font-extrabold text-[var(--ink)]">{price}</p>
        <div className="rounded-full bg-[var(--ink)] py-1.5 text-center text-[8px] font-bold uppercase tracking-wide text-white">
          {onOpen ? "View product" : "Add to cart"}
        </div>
      </div>
    </article>
  );
}

function ProductInsideView({
  mode,
  name,
  priceLabel,
  description,
  images,
  badge,
  genderFit,
  colors,
  variants,
  attributes,
  highlightTags,
  materials,
  onBack,
}: {
  mode: "web" | "phone";
  name: string;
  priceLabel: string;
  description?: string;
  images: string[];
  badge?: string;
  genderFit?: string;
  colors: string[];
  variants: PreviewVariant[];
  attributes: PreviewAttribute[];
  highlightTags: PreviewHighlightTag[];
  materials: PreviewMaterial[];
  onBack: () => void;
}) {
  const gallery = images.length ? images : [PLACEHOLDER];
  const [activeImage, setActiveImage] = useState(0);
  const [materialIdx, setMaterialIdx] = useState(0);
  const activeMaterial = materials[materialIdx] || materials[0];
  const materialColors = activeMaterial?.colors?.length
    ? activeMaterial.colors
    : colors;
  const [colorIdx, setColorIdx] = useState(0);

  const detailRows =
    attributes.length > 0
      ? attributes.filter((a) => a.value.trim())
      : [
          { label: "Fit", value: genderFit || "unisex" },
          {
            label: "Colors",
            value: variants.map((v) => v.colorName || "Color").join(", ") || "—",
          },
        ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-bold uppercase tracking-wide text-[var(--orange)] hover:underline"
        >
          ← Back to shop
        </button>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
          Product page
        </p>
        <span className="w-16" />
      </div>

      <div
        className={cn(
          "grid gap-4 p-3",
          mode === "web" ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        <div>
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[var(--soft)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[activeImage] || gallery[0]}
              alt=""
              className="absolute inset-0 size-full object-cover object-top"
            />
            {badge ? (
              <span className="absolute left-2 top-2 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                {badge}
              </span>
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative size-10 overflow-hidden rounded-lg border",
                    activeImage === i
                      ? "border-[var(--orange)]"
                      : "border-[var(--line)]"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          {highlightTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {highlightTags.map((t) => (
                <span
                  key={t.label}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    accentClass(t.accent)
                  )}
                >
                  {t.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--orange)]">
                Tigerteeh
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold uppercase leading-tight tracking-wide text-[var(--ink)]">
                {name || "Your product"}
              </h3>
            </div>
            <GenderFitMark fit={genderFit || "unisex"} size="md" />
          </div>

          <p className="text-[15px] font-extrabold text-[var(--ink)]">
            {activeMaterial
              ? `$${Number(activeMaterial.price) || 0}`
              : priceLabel}
          </p>

          {description ? (
            <p className="text-[11px] leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          ) : (
            <p className="text-[11px] italic text-[var(--muted)]">
              Add a description to preview it here.
            </p>
          )}

          {materials.length > 0 ? (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Material
              </p>
              <div className="flex flex-wrap gap-1.5">
                {materials.map((m, i) => (
                  <button
                    key={m.name + i}
                    type="button"
                    onClick={() => {
                      setMaterialIdx(i);
                      setColorIdx(0);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      materialIdx === i
                        ? "border-[var(--orange)] bg-[var(--orange)]/15 text-[var(--ink)]"
                        : "border-[var(--line)] text-[var(--muted)]"
                    )}
                  >
                    {m.name || "Material"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Color
            </p>
            <div className="flex flex-wrap gap-1.5">
              {materialColors.map((c, i) => (
                <button
                  key={c + i}
                  type="button"
                  title={variants[i]?.colorName || "Color"}
                  onClick={() => setColorIdx(i)}
                  className={cn(
                    "size-6 rounded-full border-2",
                    colorIdx === i
                      ? "border-[var(--orange)]"
                      : "border-black/10"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-full bg-[var(--forest)] py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--paper)]">
            Add to cart
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
            <p className="border-b border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]">
              Product details
            </p>
            {detailRows.length > 0 ? (
              <dl className="divide-y divide-[var(--line)] px-3">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[5.5rem_1fr] gap-2 py-2 text-[11px]"
                  >
                    <dt className="font-bold text-[var(--ink)]">{row.label}</dt>
                    <dd className="text-[var(--muted)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-3 py-3 text-[11px] text-[var(--muted)]">
                Add product details (+ Add detail) to preview them here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductShelfPreview({
  mode,
  name,
  priceLabel,
  description,
  imageUrl,
  imageUrls,
  badge,
  genderFit = "unisex",
  variants,
  attributes = [],
  highlightTags = [],
  materials = [],
}: Props) {
  const [view, setView] = useState<"shelf" | "pdp">("shelf");

  const yoursColors = useMemo(
    () =>
      variants.map((v) =>
        buildSwatchCss({
          colorStyle: v.colorStyle,
          colorHex: v.colorHex,
          colorHex2: v.colorHex2,
        })
      ),
    [variants]
  );

  const yoursImages = (
    imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []
  ).filter(Boolean);

  const yours = {
    name: name || "Your new product",
    price: priceLabel,
    images: yoursImages.length ? yoursImages : [PLACEHOLDER],
    colors: yoursColors.length ? yoursColors : ["#161412"],
    badge,
    genderFit,
  };

  const cards =
    mode === "web"
      ? [
          { ...NEIGHBORS[0], genderFit: "men" as string },
          yours,
          { ...NEIGHBORS[1], genderFit: "women" as string },
        ]
      : [yours, { ...NEIGHBORS[0], genderFit: "men" as string }];

  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--line)] bg-[var(--soft)] shadow-xl",
        mode === "web"
          ? "w-full rounded-2xl"
          : "w-[300px] rounded-[2rem] border-[6px] border-[var(--forest)]"
      )}
    >
      {view === "shelf" ? (
        <>
          <div className="border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 text-[8px] font-bold uppercase tracking-wide text-[var(--muted)]">
                <span className="text-[var(--orange)]">Home</span>
                <span>Shop</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                Tigerteeh
              </p>
              <div className="size-4 rounded-full bg-[var(--soft)]" />
            </div>
          </div>
          <div className="px-3 pb-2 pt-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--orange)]">
              Fresh style
            </p>
            <p className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
              {mode === "web" ? "New Arrivals" : "Shop"}
            </p>
          </div>
          <div
            className={cn(
              "grid gap-2.5 px-3 pb-4",
              mode === "web" ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            {cards.map((card, i) => {
              const isYours = !("key" in card);
              return (
                <MiniCard
                  key={"key" in card ? card.key : "yours"}
                  name={card.name}
                  price={card.price}
                  images={card.images}
                  colors={card.colors}
                  badge={"badge" in card ? card.badge : undefined}
                  genderFit={card.genderFit || "unisex"}
                  highlight={isYours}
                  compact={mode === "phone" && i === 1}
                  onOpen={isYours ? () => setView("pdp") : undefined}
                />
              );
            })}
          </div>
          <p className="border-t border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-center text-[10px] text-[var(--muted)]">
            Click your highlighted card to open the product page preview
          </p>
        </>
      ) : (
        <ProductInsideView
          mode={mode}
          name={yours.name}
          priceLabel={priceLabel}
          description={description}
          images={yours.images}
          badge={badge}
          genderFit={genderFit}
          colors={yours.colors}
          variants={variants}
          attributes={attributes}
          highlightTags={highlightTags}
          materials={materials}
          onBack={() => setView("shelf")}
        />
      )}
    </div>
  );
}
