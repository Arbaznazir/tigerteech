"use client";

import { useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { ColorSwatchField } from "@/components/ColorSwatchField";
import { buildSwatchCss } from "@/lib/colorSwatch";
import { cn } from "@/lib/cn";
import {
  emptyColor,
  emptyMaterial,
  type GraphColor,
  type GraphMaterial,
  type VariantGraph,
} from "@/lib/variantGraph";

type Props = {
  value: VariantGraph;
  onChange: (next: VariantGraph) => void;
  photoUrls?: string[];
};

type ColorDraft = {
  sourceId: string | null;
  color: GraphColor;
};

type MaterialDraft = {
  sourceId: string | null;
  material: GraphMaterial;
};

export function VariantGraphEditor({
  value,
  onChange,
  photoUrls = [],
}: Props) {
  const [colorDraft, setColorDraft] = useState<ColorDraft | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft | null>(
    null
  );
  const [materialError, setMaterialError] = useState<string | null>(null);

  function commit(next: VariantGraph) {
    onChange(next);
  }

  function toggleLink(materialId: string, colorId: string) {
    commit({
      ...value,
      materials: value.materials.map((m) => {
        if (m.id !== materialId) return m;
        const on = m.colorIds.includes(colorId);
        return {
          ...m,
          colorIds: on
            ? m.colorIds.filter((id) => id !== colorId)
            : [...m.colorIds, colorId],
        };
      }),
    });
  }

  function startNewColor() {
    setColorError(null);
    setColorDraft({ sourceId: null, color: emptyColor() });
  }

  function startEditColor(c: GraphColor) {
    setColorError(null);
    setColorDraft({ sourceId: c.id, color: { ...c } });
  }

  function patchColorDraft(
    patch: Partial<GraphColor> & { colorName?: string }
  ) {
    if (!colorDraft) return;
    const { colorName, ...rest } = patch;
    setColorDraft({
      ...colorDraft,
      color: {
        ...colorDraft.color,
        ...rest,
        ...(colorName !== undefined ? { name: colorName } : {}),
      },
    });
  }

  function cancelColorDraft() {
    setColorDraft(null);
    setColorError(null);
  }

  function saveColor() {
    if (!colorDraft) return;
    const name = colorDraft.color.name.trim();
    if (!name) {
      setColorError("Give this color a name before saving.");
      return;
    }
    const saved: GraphColor = { ...colorDraft.color, name };

    if (colorDraft.sourceId) {
      commit({
        ...value,
        colors: value.colors.map((c) =>
          c.id === colorDraft.sourceId ? saved : c
        ),
      });
    } else {
      commit({
        ...value,
        colors: [...value.colors, saved],
      });
    }

    setColorDraft(null);
    setColorError(null);
  }

  function removeColor(colorId: string) {
    const color = value.colors.find((c) => c.id === colorId);
    const label = color?.name?.trim() || "this color";
    if (!window.confirm(`Do you want to remove this color?\n\n“${label}”`)) {
      return;
    }
    commit({
      colors: value.colors.filter((x) => x.id !== colorId),
      materials: value.materials.map((m) => ({
        ...m,
        colorIds: m.colorIds.filter((id) => id !== colorId),
      })),
    });
    if (
      colorDraft?.sourceId === colorId ||
      colorDraft?.color.id === colorId
    ) {
      setColorDraft(null);
      setColorError(null);
    }
  }

  function startNewMaterial() {
    setMaterialError(null);
    setMaterialDraft({ sourceId: null, material: emptyMaterial() });
  }

  function startEditMaterial(m: GraphMaterial) {
    setMaterialError(null);
    setMaterialDraft({
      sourceId: m.id,
      material: { ...m, colorIds: [...m.colorIds] },
    });
  }

  function patchMaterialDraft(patch: Partial<GraphMaterial>) {
    if (!materialDraft) return;
    setMaterialDraft({
      ...materialDraft,
      material: { ...materialDraft.material, ...patch },
    });
  }

  function toggleDraftLink(colorId: string) {
    if (!materialDraft) return;
    const on = materialDraft.material.colorIds.includes(colorId);
    patchMaterialDraft({
      colorIds: on
        ? materialDraft.material.colorIds.filter((id) => id !== colorId)
        : [...materialDraft.material.colorIds, colorId],
    });
  }

  function cancelMaterialDraft() {
    setMaterialDraft(null);
    setMaterialError(null);
  }

  function saveMaterial() {
    if (!materialDraft) return;
    const name = materialDraft.material.name.trim();
    if (!name) {
      setMaterialError("Give this material a name before saving.");
      return;
    }
    const saved: GraphMaterial = {
      ...materialDraft.material,
      name,
      price: Number(materialDraft.material.price) || 0,
      stock: Math.max(0, Math.floor(Number(materialDraft.material.stock) || 0)),
      maxPerOrder: Math.max(
        0,
        Math.floor(Number(materialDraft.material.maxPerOrder) || 0)
      ),
    };

    if (materialDraft.sourceId) {
      commit({
        ...value,
        materials: value.materials.map((m) =>
          m.id === materialDraft.sourceId ? saved : m
        ),
      });
    } else {
      commit({
        ...value,
        materials: [...value.materials, saved],
      });
    }

    setMaterialDraft(null);
    setMaterialError(null);
  }

  function removeMaterial(materialId: string) {
    const mat = value.materials.find((m) => m.id === materialId);
    const label = mat?.name?.trim() || "this material";
    if (!window.confirm(`Do you want to remove this material?\n\n“${label}”`)) {
      return;
    }
    commit({
      ...value,
      materials: value.materials.filter((m) => m.id !== materialId),
    });
    if (
      materialDraft?.sourceId === materialId ||
      materialDraft?.material.id === materialId
    ) {
      setMaterialDraft(null);
      setMaterialError(null);
    }
  }

  const isNewColorDraft = colorDraft !== null && colorDraft.sourceId === null;
  const editingColorId = colorDraft?.sourceId ?? null;
  const isNewMaterialDraft =
    materialDraft !== null && materialDraft.sourceId === null;
  const editingMaterialId = materialDraft?.sourceId ?? null;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <p className="text-[12px] font-semibold text-[var(--ink)]">
          Materials & colors
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">
          Save colors and materials, then link them under Available in.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-[var(--line)] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Colors
            </span>
            <button
              type="button"
              disabled={colorDraft !== null}
              className="text-[12px] font-semibold text-[var(--orange)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              onClick={startNewColor}
            >
              + Add color
            </button>
          </div>

          <ul className="space-y-2">
            {value.colors.length === 0 && !colorDraft ? (
              <li className="rounded-lg border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
                No colors yet — add one, then Save color
              </li>
            ) : null}

            {value.colors.map((c) => {
              const open = editingColorId === c.id;
              const css = buildSwatchCss(c);
              return (
                <li
                  key={c.id}
                  className={cn(
                    "rounded-lg border",
                    open ? "border-[var(--orange)]" : "border-[var(--line)]"
                  )}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      disabled={colorDraft !== null && !open}
                      onClick={() =>
                        open ? cancelColorDraft() : startEditColor(c)
                      }
                    >
                      <span
                        className="size-7 shrink-0 rounded-full border border-[var(--line)]"
                        style={{ background: css }}
                      />
                      <span className="min-w-0 truncate text-[13px] font-medium text-[var(--ink)]">
                        {c.name || "Untitled"}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase text-[var(--muted)]">
                        {c.colorStyle}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove color"
                      className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-red-50 hover:text-[#b42318]"
                      onClick={() => removeColor(c.id)}
                    >
                      <span className="text-[16px] leading-none">×</span>
                    </button>
                  </div>

                  {open && colorDraft ? (
                    <ColorEditorPanel
                      draft={colorDraft.color}
                      error={colorError}
                      photoUrls={photoUrls}
                      onPatch={patchColorDraft}
                      onSave={saveColor}
                      onCancel={cancelColorDraft}
                    />
                  ) : null}
                </li>
              );
            })}

            {isNewColorDraft && colorDraft ? (
              <li className="rounded-lg border border-[var(--orange)]">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span
                    className="size-7 shrink-0 rounded-full border border-[var(--line)]"
                    style={{ background: buildSwatchCss(colorDraft.color) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ink)]">
                    {colorDraft.color.name.trim() || "New color"}
                  </span>
                  <span className="rounded bg-[var(--soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
                    Draft
                  </span>
                  <button
                    type="button"
                    aria-label="Discard draft"
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-red-50 hover:text-[#b42318]"
                    onClick={cancelColorDraft}
                  >
                    <span className="text-[16px] leading-none">×</span>
                  </button>
                </div>
                <ColorEditorPanel
                  draft={colorDraft.color}
                  error={colorError}
                  photoUrls={photoUrls}
                  onPatch={patchColorDraft}
                  onSave={saveColor}
                  onCancel={cancelColorDraft}
                />
              </li>
            ) : null}
          </ul>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Materials
            </span>
            <button
              type="button"
              disabled={materialDraft !== null}
              className="text-[12px] font-semibold text-[var(--orange)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              onClick={startNewMaterial}
            >
              + Add material
            </button>
          </div>

          <ul className="space-y-2">
            {value.materials.length === 0 && !materialDraft ? (
              <li className="rounded-lg border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
                No materials yet — add one, then Save material
              </li>
            ) : null}

            {value.materials.map((m) => {
              const open = editingMaterialId === m.id;
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-lg border",
                    open ? "border-[var(--orange)]" : "border-[var(--line)]"
                  )}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 flex-col items-start text-left"
                      disabled={materialDraft !== null && !open}
                      onClick={() =>
                        open ? cancelMaterialDraft() : startEditMaterial(m)
                      }
                    >
                      <span className="truncate text-[13px] font-medium text-[var(--ink)]">
                        {m.name || "Untitled"}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">
                        ${Number(m.price) || 0}
                        {" · "}
                        stock {m.stock}
                        {m.maxPerOrder > 0
                          ? ` · max ${m.maxPerOrder}/order`
                          : " · no limit"}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove material"
                      className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-red-50 hover:text-[#b42318]"
                      onClick={() => removeMaterial(m.id)}
                    >
                      <span className="text-[16px] leading-none">×</span>
                    </button>
                  </div>

                  {!open ? (
                    <div className="border-t border-[var(--line)] px-3 py-2.5">
                      <ColorLinkRow
                        colors={value.colors}
                        linkedIds={m.colorIds}
                        onToggle={(colorId) => toggleLink(m.id, colorId)}
                      />
                    </div>
                  ) : materialDraft ? (
                    <MaterialEditorPanel
                      draft={materialDraft.material}
                      colors={value.colors}
                      error={materialError}
                      onPatch={patchMaterialDraft}
                      onToggleColor={toggleDraftLink}
                      onSave={saveMaterial}
                      onCancel={cancelMaterialDraft}
                    />
                  ) : null}
                </li>
              );
            })}

            {isNewMaterialDraft && materialDraft ? (
              <li className="rounded-lg border border-[var(--orange)]">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ink)]">
                    {materialDraft.material.name.trim() || "New material"}
                  </span>
                  <span className="rounded bg-[var(--soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
                    Draft
                  </span>
                  <button
                    type="button"
                    aria-label="Discard draft"
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-red-50 hover:text-[#b42318]"
                    onClick={cancelMaterialDraft}
                  >
                    <span className="text-[16px] leading-none">×</span>
                  </button>
                </div>
                <MaterialEditorPanel
                  draft={materialDraft.material}
                  colors={value.colors}
                  error={materialError}
                  onPatch={patchMaterialDraft}
                  onToggleColor={toggleDraftLink}
                  onSave={saveMaterial}
                  onCancel={cancelMaterialDraft}
                />
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ColorLinkRow({
  colors,
  linkedIds,
  onToggle,
}: {
  colors: GraphColor[];
  linkedIds: string[];
  onToggle: (colorId: string) => void;
}) {
  if (colors.length === 0) {
    return (
      <p className="text-[12px] text-[var(--muted)]">
        Save a color on the left to link it here
      </p>
    );
  }
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-[var(--muted)]">Available in</p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => {
          const on = linkedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-2.5 text-[12px] transition",
                on
                  ? "border-[3px] border-[var(--orange)] bg-[var(--orange)]/15 font-semibold text-[var(--ink)] shadow-[0_0_0_1px_rgba(243,129,32,0.35)]"
                  : "border border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)]/35"
              )}
            >
              <span
                className={cn(
                  "size-5 shrink-0 rounded-full border border-black/10",
                  on && "ring-2 ring-[var(--orange)]/40"
                )}
                style={{ background: buildSwatchCss(c) }}
              />
              {c.name || "Untitled"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaterialEditorPanel({
  draft,
  colors,
  error,
  onPatch,
  onToggleColor,
  onSave,
  onCancel,
}: {
  draft: GraphMaterial;
  colors: GraphColor[];
  error: string | null;
  onPatch: (patch: Partial<GraphMaterial>) => void;
  onToggleColor: (colorId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 border-t border-[var(--line)] px-3 py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Material
          </span>
          <input
            className="h-11 w-full rounded-md border border-[var(--line)] px-3 text-[14px] outline-none focus:border-[var(--orange)]"
            placeholder="e.g. Silk"
            autoFocus
            value={draft.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSave();
              }
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Price
          </span>
          <AmountInput
            className="h-11 w-full rounded-md border border-[var(--line)] px-3 text-[14px] outline-none focus:border-[var(--orange)]"
            value={draft.price}
            placeholder="0"
            onChange={(price) => onPatch({ price })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Initial stock
          </span>
          <AmountInput
            className="h-11 w-full rounded-md border border-[var(--line)] px-3 text-[14px] outline-none focus:border-[var(--orange)]"
            value={draft.stock}
            placeholder="0"
            emptyZero={false}
            onChange={(stock) =>
              onPatch({ stock: Math.max(0, Math.floor(stock)) })
            }
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Max per order <span className="font-normal">(optional)</span>
          </span>
          <AmountInput
            className="h-11 w-full rounded-md border border-[var(--line)] px-3 text-[14px] outline-none focus:border-[var(--orange)]"
            value={draft.maxPerOrder}
            placeholder="No limit"
            emptyZero
            min={0}
            onChange={(maxPerOrder) =>
              onPatch({
                maxPerOrder: Math.max(0, Math.floor(maxPerOrder)),
              })
            }
          />
        </label>
      </div>

      <ColorLinkRow
        colors={colors}
        linkedIds={draft.colorIds}
        onToggle={onToggleColor}
      />

      {error ? (
        <p className="text-[12px] text-[#b42318]">{error}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className="h-8 rounded-md px-3 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-8 rounded-full bg-[var(--orange)] px-3.5 text-[12px] font-semibold text-[var(--ink)] transition hover:opacity-90"
          onClick={onSave}
        >
          Save material
        </button>
      </div>
    </div>
  );
}

function ColorEditorPanel({
  draft,
  error,
  photoUrls,
  onPatch,
  onSave,
  onCancel,
}: {
  draft: GraphColor;
  error: string | null;
  photoUrls: string[];
  onPatch: (patch: Partial<GraphColor> & { colorName?: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 border-t border-[var(--line)] px-3 py-3">
      <input
        type="text"
        autoComplete="off"
        autoFocus
        placeholder="Color name"
        className="h-9 w-full rounded-md border border-[var(--line)] px-2.5 text-[13px] outline-none focus:border-[var(--orange)]"
        value={draft.name}
        onChange={(e) => onPatch({ colorName: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave();
          }
        }}
      />
      <ColorSwatchField
        colorStyle={draft.colorStyle}
        colorHex={draft.colorHex}
        colorHex2={draft.colorHex2}
        photoUrls={photoUrls}
        onChange={onPatch}
      />
      {error ? (
        <p className="text-[12px] text-[#b42318]">{error}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className="h-8 rounded-md px-3 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-8 rounded-full bg-[var(--orange)] px-3.5 text-[12px] font-semibold text-[var(--ink)] transition hover:opacity-90"
          onClick={onSave}
        >
          Save color
        </button>
      </div>
    </div>
  );
}
