"use client";

import { useRef, useState } from "react";
import {
  COLOR_STYLE_OPTIONS,
  buildSwatchCss,
  pickColorAtPoint,
  sampleColorsFromImage,
  type ColorStyle,
} from "@/lib/colorSwatch";
import { cn } from "@/lib/cn";

type Props = {
  colorStyle: ColorStyle;
  colorHex: string;
  colorHex2: string;
  onChange: (next: {
    colorStyle?: ColorStyle;
    colorHex?: string;
    colorHex2?: string;
  }) => void;
  photoUrls?: string[];
};

export function ColorSwatchField({
  colorStyle,
  colorHex,
  colorHex2,
  onChange,
  photoUrls = [],
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const [pickingUrl, setPickingUrl] = useState<string | null>(null);
  const [target, setTarget] = useState<"primary" | "secondary">("primary");
  const css = buildSwatchCss({ colorStyle, colorHex, colorHex2 });
  const needsSecond = colorStyle !== "solid";

  async function onPhotoFile(file: File) {
    const colors = await sampleColorsFromImage(file, 8);
    setSamples(colors);
    const url = URL.createObjectURL(file);
    setPickingUrl(url);
    if (colors[0]) onChange({ colorHex: colors[0] });
    if (colors[1] && needsSecond) onChange({ colorHex2: colors[1] });
  }

  async function onPickClick(
    e: React.MouseEvent<HTMLButtonElement>,
    url: string
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const hex = await pickColorAtPoint(url, x, y);
    if (target === "secondary") onChange({ colorHex2: hex });
    else onChange({ colorHex: hex });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {COLOR_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={opt.hint}
            onClick={() => onChange({ colorStyle: opt.id })}
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-medium transition",
              colorStyle === opt.id
                ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="size-9 shrink-0 rounded-full border border-[var(--line)]"
          style={{ background: css }}
        />
        <div className={cn("flex min-w-0 flex-1 gap-2", needsSecond && "flex-col sm:flex-row")}>
          <label className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-[var(--line)] bg-white">
            <span className="sr-only">Base hex</span>
            <input
              type="color"
              className="h-full w-9 shrink-0 cursor-pointer border-0 bg-transparent p-1"
              value={/^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : "#161412"}
              onChange={(e) =>
                onChange({ colorHex: e.target.value.toUpperCase() })
              }
              onFocus={() => setTarget("primary")}
            />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-[12px] uppercase outline-none"
              value={colorHex}
              onChange={(e) => onChange({ colorHex: e.target.value })}
              onFocus={() => setTarget("primary")}
              placeholder="#161412"
            />
          </label>
          {needsSecond ? (
            <label className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-[var(--line)] bg-white">
              <span className="sr-only">Accent hex</span>
              <input
                type="color"
                className="h-full w-9 shrink-0 cursor-pointer border-0 bg-transparent p-1"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(colorHex2) ? colorHex2 : "#F38120"
                }
                onChange={(e) =>
                  onChange({ colorHex2: e.target.value.toUpperCase() })
                }
                onFocus={() => setTarget("secondary")}
              />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-[12px] uppercase outline-none"
                value={colorHex2}
                onChange={(e) => onChange({ colorHex2: e.target.value })}
                onFocus={() => setTarget("secondary")}
                placeholder="#F38120"
              />
            </label>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-dashed border-[var(--line)] px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--muted)]">
            Pick from photo ({target === "primary" ? "base" : "accent"})
          </span>
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--orange)] hover:underline"
            onClick={() => fileRef.current?.click()}
          >
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onPhotoFile(file);
            }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...photoUrls, ...(pickingUrl ? [pickingUrl] : [])]
            .filter(Boolean)
            .slice(0, 5)
            .map((url) => (
              <button
                key={url}
                type="button"
                className="size-9 overflow-hidden rounded border border-[var(--line)]"
                onClick={(e) => void onPickClick(e, url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
        </div>
        {samples.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {samples.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                className="size-5 rounded-full border border-[var(--line)]"
                style={{ background: hex }}
                onClick={() =>
                  target === "secondary"
                    ? onChange({ colorHex2: hex })
                    : onChange({ colorHex: hex })
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
