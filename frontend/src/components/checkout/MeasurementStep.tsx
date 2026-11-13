"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { MeasurementGuideCard } from "@/components/checkout/MeasurementGuideCard";
import { Button } from "@/components/ui/Button";
import type { CartLine } from "@/lib/cart";
import {
  GUIDE_IMAGES,
  allowedMeasGenders,
  bottomFieldsFor,
  cartLineKey,
  createBlankSet,
  defaultMeasGender,
  filterSetsForFit,
  fitLabel,
  isComplete,
  progressPercent,
  snapshotFromSet,
  topFieldsFor,
  type LineMeasurementAssignment,
  type MeasGender,
  type MeasUnit,
  type MeasurementSet,
} from "@/lib/measurements";
import { cn } from "@/lib/cn";

export type MeasCartLine = CartLine & {
  needTop: boolean;
  needBottom: boolean;
};

type Props = {
  lines: MeasCartLine[];
  sets: MeasurementSet[];
  onSetsChange: (sets: MeasurementSet[]) => void;
  /** Profile gender from signup — used as default when creating sets. */
  userGender?: string | null;
  onBack: () => void;
  onContinue: (payload: {
    assignments: LineMeasurementAssignment[];
    byLine: Record<string, LineMeasurementAssignment>;
  }) => void;
};

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-[13px] text-ink outline-none transition placeholder:text-muted focus:border-ink";

const labelClass =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink";

export function MeasurementStep({
  lines,
  sets,
  onSetsChange,
  userGender,
  onBack,
  onContinue,
}: Props) {
  /** lineKey → measurement set id */
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  /** lineKey → which gender of measurements to use (needed for unisex) */
  const [lineGender, setLineGender] = useState<Record<string, MeasGender>>({});
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const lineMeta = useMemo(
    () =>
      lines.map((line) => {
        const key = cartLineKey(line);
        const fit = line.product.genderFit || "unisex";
        const allowed = allowedMeasGenders(fit);
        return { line, key, fit, allowed };
      }),
    [lines]
  );

  // Seed per-line gender from product fit + profile.
  useEffect(() => {
    setLineGender((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { key, fit, allowed } of lineMeta) {
        if (next[key] && allowed.includes(next[key])) continue;
        next[key] = defaultMeasGender(fit, userGender);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [lineMeta, userGender]);

  // Prefill assignments once gender is known.
  useEffect(() => {
    setAssignments((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { line, key, fit } of lineMeta) {
        if (next[key]) {
          const existing = sets.find((s) => s.id === next[key]);
          const gender = lineGender[key] || defaultMeasGender(fit, userGender);
          if (
            existing &&
            (existing.gender === gender || existing.id === expandedSetId)
          ) {
            continue;
          }
          // Stale assignment for a different gender — clear and try again.
          delete next[key];
          changed = true;
        }
        const gender = lineGender[key] || defaultMeasGender(fit, userGender);
        const compatible = filterSetsForFit(sets, fit).filter(
          (s) => s.gender === gender
        );
        const complete = compatible.find((s) =>
          isComplete({
            gender: s.gender,
            needTop: line.needTop,
            needBottom: line.needBottom,
            top: s.top,
            bottom: s.bottom,
          })
        );
        const pick = complete || compatible[0];
        if (pick) {
          next[key] = pick.id;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [lineMeta, sets, userGender, lineGender, expandedSetId]);

  function patchSet(id: string, patch: Partial<MeasurementSet>) {
    onSetsChange(
      sets.map((s) =>
        s.id === id
          ? { ...s, ...patch, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }

  function changeLineGender(key: string, gender: MeasGender) {
    setLineGender((g) => ({ ...g, [key]: gender }));
    setAssignments((a) => {
      const setId = a[key];
      if (!setId) return a;
      const set = sets.find((s) => s.id === setId);
      if (set && set.gender === gender) return a;
      const rest = { ...a };
      delete rest[key];
      return rest;
    });
    setError("");
  }

  function startCreate(lineKey: string, fit: string, gender: MeasGender) {
    const allowed = allowedMeasGenders(fit);
    const nextGender = allowed.includes(gender) ? gender : allowed[0];
    const set = createBlankSet("", nextGender, "cm");
    onSetsChange([set, ...sets]);
    setLineGender((g) => ({ ...g, [lineKey]: nextGender }));
    setAssignments((a) => ({ ...a, [lineKey]: set.id }));
    setExpandedSetId(set.id);
    setError("");
  }

  function saveAndContinue() {
    const byLine: Record<string, LineMeasurementAssignment> = {};
    const list: LineMeasurementAssignment[] = [];

    for (const { line, key, fit, allowed } of lineMeta) {
      const gender = lineGender[key] || defaultMeasGender(fit, userGender);
      if (!allowed.includes(gender)) {
        setError(`Choose Male or Female for ${line.product.name}.`);
        return;
      }
      const setId = assignments[key];
      if (!setId) {
        setError(`Select measurements for ${line.product.name}.`);
        return;
      }
      const set = sets.find((s) => s.id === setId);
      if (!set) {
        setError(`Select measurements for ${line.product.name}.`);
        return;
      }
      if (set.gender !== gender) {
        setError(
          `${line.product.name} needs a ${gender} measurement set.`
        );
        return;
      }
      if (!allowed.includes(set.gender)) {
        setError(
          `${line.product.name} needs a ${fitLabel(fit).toLowerCase()} measurement set.`
        );
        return;
      }
      if (
        !isComplete({
          gender: set.gender,
          needTop: line.needTop,
          needBottom: line.needBottom,
          top: set.top,
          bottom: set.bottom,
        })
      ) {
        setExpandedSetId(set.id);
        setError(
          `Finish measurements for “${set.name}” (${line.product.name}).`
        );
        return;
      }
      const snap = snapshotFromSet(set, {
        lineKey: key,
        productId: line.productId,
        productName: line.product.name,
        variantId: line.variantId,
        size: line.size,
        color: line.color,
        genderFit: fit,
        needTop: line.needTop,
        needBottom: line.needBottom,
      });
      byLine[key] = snap;
      list.push(snap);
    }

    setError("");
    onContinue({ assignments: list, byLine });
  }

  return (
    <section className="space-y-6 rounded-2xl border border-line bg-paper p-5 md:p-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
          Step 2 · Fit
        </p>
        <h2 className="font-display mt-1 text-3xl tracking-wide text-ink md:text-4xl">
          Measurements
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          For each item, pick who it’s for, then choose a saved measurement set
          — or add a new named one. Men’s pieces use male sets; women’s use
          female; Men &amp; Women pieces can use either.
        </p>
      </div>

      <div className="space-y-4">
        {lineMeta.map(({ line, key, fit, allowed }) => {
          const gender =
            lineGender[key] || defaultMeasGender(fit, userGender);
          const genderLocked = allowed.length === 1;
          const compatible = filterSetsForFit(sets, fit).filter(
            (s) => s.gender === gender
          );
          const setId = assignments[key] || "";
          const active = sets.find((s) => s.id === setId) || null;
          const progress = active
            ? progressPercent({
                gender: active.gender,
                needTop: line.needTop,
                needBottom: line.needBottom,
                top: active.top,
                bottom: active.bottom,
              })
            : 0;
          const needsLabel = [
            line.needTop
              ? gender === "female"
                ? "top"
                : "shirt"
              : null,
            line.needBottom
              ? gender === "female"
                ? "pant"
                : "trouser"
              : null,
          ]
            .filter(Boolean)
            .join(" + ");
          const showEditor =
            active &&
            (expandedSetId === active.id ||
              !isComplete({
                gender: active.gender,
                needTop: line.needTop,
                needBottom: line.needBottom,
                top: active.top,
                bottom: active.bottom,
              }));

          return (
            <article
              key={key}
              className="rounded-2xl border border-line bg-white"
            >
              <div className="rounded-t-2xl border-b border-line bg-soft/35 px-4 py-4 md:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl tracking-wide text-ink md:text-2xl">
                      {line.product.name}
                    </h3>
                    <p className="mt-1 text-[12px] text-muted">
                      {[
                        line.size,
                        line.color || null,
                        line.quantity > 1 ? `qty ${line.quantity}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        Fit · {fitLabel(fit)}
                      </span>
                      <span className="text-[11px] text-muted">
                        Needs {needsLabel} measurements
                      </span>
                    </div>
                  </div>
                  {active ? (
                    <div className="min-w-[148px]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                        Progress {progress}%
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                        <div
                          className="h-full rounded-full bg-orange transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 px-4 py-4 md:px-5">
                  <div>
                    <div className="flex flex-wrap items-end gap-3">
                      <FitSelect
                        label="For"
                        className="w-[148px] shrink-0"
                        value={gender}
                        disabled={genderLocked}
                        placeholder="Who"
                        options={allowed.map((g) => ({
                          value: g,
                          label: g === "male" ? "Male" : "Female",
                        }))}
                        onChange={(next) =>
                          changeLineGender(key, next as MeasGender)
                        }
                      />

                      <FitSelect
                        label="Measurement set"
                        className="w-[280px] max-w-full shrink"
                        value={setId}
                        placeholder="Choose a set"
                        options={compatible.map((s) => {
                          const done = isComplete({
                            gender: s.gender,
                            needTop: line.needTop,
                            needBottom: line.needBottom,
                            top: s.top,
                            bottom: s.bottom,
                          });
                          return {
                            value: s.id,
                            label: `${s.name} · ${s.unit}${done ? "" : " · incomplete"}`,
                          };
                        })}
                        onChange={(id) => {
                          setAssignments((a) => ({ ...a, [key]: id }));
                          if (id) setExpandedSetId(id);
                        }}
                      />

                      <Button
                        type="button"
                        variant="forest"
                        size="md"
                        onClick={() => startCreate(key, fit, gender)}
                        className="shrink-0"
                      >
                        <Plus className="size-3.5" strokeWidth={2.25} />
                        Add new
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      {compatible.length === 0
                        ? `No ${gender} sets yet — add one to continue.`
                        : `${compatible.length} saved ${gender} set${compatible.length === 1 ? "" : "s"}.`}
                    </p>
                  </div>

                {showEditor && active ? (
                  <SetEditor
                    set={active}
                    needTop={line.needTop}
                    needBottom={line.needBottom}
                    genderLocked={genderLocked}
                    allowedGenders={allowed}
                    onPatch={(patch) => {
                      if (patch.gender && patch.gender !== gender) {
                        setLineGender((current) => ({
                          ...current,
                          [key]: patch.gender as MeasGender,
                        }));
                      }
                      patchSet(active.id, patch);
                    }}
                  />
                ) : active && progress === 100 ? (
                  <button
                    type="button"
                    onClick={() => setExpandedSetId(active.id)}
                    className="text-[12px] font-semibold text-orange underline-offset-2 hover:underline"
                  >
                    Edit “{active.name}”
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button
          type="button"
          variant="white"
          size="md"
          className="border border-line"
          onClick={onBack}
        >
          Back
        </Button>
        <Button type="button" size="md" onClick={saveAndContinue}>
          Save measurements & continue
        </Button>
      </div>
    </section>
  );
}

function SetEditor({
  set,
  needTop,
  needBottom,
  genderLocked,
  allowedGenders,
  onPatch,
}: {
  set: MeasurementSet;
  needTop: boolean;
  needBottom: boolean;
  genderLocked: boolean;
  allowedGenders: MeasGender[];
  onPatch: (patch: Partial<MeasurementSet>) => void;
}) {
  const topFields = topFieldsFor(set.gender);
  const bottomFields = bottomFieldsFor(set.gender);
  const progress = progressPercent({
    gender: set.gender,
    needTop,
    needBottom,
    top: set.top,
    bottom: set.bottom,
  });

  function setGender(next: MeasGender) {
    const top: Record<string, string> = {};
    const bottom: Record<string, string> = {};
    for (const f of topFieldsFor(next)) top[f.key] = set.top[f.key] || "";
    for (const f of bottomFieldsFor(next))
      bottom[f.key] = set.bottom[f.key] || "";
    onPatch({ gender: next, top, bottom });
  }

  return (
    <div className="space-y-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Editing · {set.name}
        </p>
        <p className="text-[11px] text-muted">
          Measurement progress:{" "}
          <span className="font-semibold text-ink">{progress}%</span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Set name</span>
          <input
            value={set.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder="e.g. Husband · Office"
            className={inputClass}
          />
        </label>
        <FitSelect
          label="Measurement for"
          value={set.gender}
          disabled={genderLocked}
          placeholder="Who"
          options={allowedGenders.map((g) => ({
            value: g,
            label: g === "male" ? "Male" : "Female",
          }))}
          onChange={(next) => setGender(next as MeasGender)}
        />
        <FitSelect
          label="Unit"
          value={set.unit}
          placeholder="Unit"
          options={[
            { value: "cm", label: "Centimeters (cm)" },
            { value: "in", label: "Inches (in)" },
          ]}
          onChange={(next) => onPatch({ unit: next as MeasUnit })}
        />
      </div>

      {needTop ? (
        <div className="rounded-2xl border border-line bg-soft/20 p-4">
          <h4 className="font-display text-xl tracking-wide">
            {set.gender === "female" ? "Top measurements" : "Shirt measurements"}
          </h4>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <MeasurementGuideCard
              src={
                set.gender === "female"
                  ? GUIDE_IMAGES.femaleTop
                  : GUIDE_IMAGES.maleTop
              }
              title={
                set.gender === "female"
                  ? "Women's top measurements"
                  : "Men's shirt measurements"
              }
              note="All measurements should be taken on the body, not over clothing. Keep the tape snug, not tight."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {topFields.map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="mb-1 block text-[12px] font-semibold">
                    {f.label} *
                  </span>
                  <input
                    required
                    inputMode="decimal"
                    value={set.top[f.key] || ""}
                    onChange={(e) =>
                      onPatch({
                        top: { ...set.top, [f.key]: e.target.value },
                      })
                    }
                    placeholder={set.unit}
                    title={f.hint}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10px] leading-snug text-muted">
                    {f.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {needBottom ? (
        <div className="rounded-2xl border border-line bg-soft/20 p-4">
          <h4 className="font-display text-xl tracking-wide">
            {set.gender === "female"
              ? "Pant measurements"
              : "Trouser measurements"}
          </h4>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <MeasurementGuideCard
              src={
                set.gender === "female"
                  ? GUIDE_IMAGES.femaleBottom
                  : GUIDE_IMAGES.maleBottom
              }
              title={
                set.gender === "female"
                  ? "Women's pant measurements"
                  : "Men's trouser measurements"
              }
              note="Measurements should be taken over thin clothing. Keep the measuring tape snug, not tight."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {bottomFields.map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="mb-1 block text-[12px] font-semibold">
                    {f.label} *
                  </span>
                  <input
                    required
                    inputMode="decimal"
                    value={set.bottom[f.key] || ""}
                    onChange={(e) =>
                      onPatch({
                        bottom: { ...set.bottom, [f.key]: e.target.value },
                      })
                    }
                    placeholder={set.unit}
                    title={f.hint}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10px] leading-snug text-muted">
                    {f.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className={labelClass}>Measurement notes (optional)</span>
        <textarea
          value={set.notes}
          onChange={(e) => onPatch({ notes: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-line bg-white px-3 py-3 text-[13px] outline-none transition focus:border-ink"
        />
      </label>
    </div>
  );
}

function FitSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <span className={labelClass}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((next) => !next)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3.5 text-left text-[13px] text-ink transition hover:border-ink/30 focus:border-ink disabled:cursor-not-allowed disabled:bg-soft/70",
          open && "border-ink"
        )}
      >
        <span className={cn("truncate", !current && "text-muted")}>
          {current?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <ul
          id={listId}
          className="absolute z-30 mt-1.5 max-h-56 w-full min-w-[180px] overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-[0_16px_40px_rgba(18,16,14,0.14)]"
        >
          {options.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[12px] text-muted">
              Nothing saved yet
            </li>
          ) : (
            options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-3.5 py-2.5 text-left text-[13px] text-ink transition hover:bg-soft",
                    option.value === value && "bg-soft font-semibold"
                  )}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
