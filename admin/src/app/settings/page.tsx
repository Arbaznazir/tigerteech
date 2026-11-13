"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { State } from "country-state-city";
import { Check, MapPin, Pencil, Trash2 } from "lucide-react";
import {
  FlagCountrySelect,
  flagEmoji,
} from "@/components/FlagCountrySelect";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

type CodRule = {
  countryIso: string;
  countryName: string;
  scope: "country" | "states";
  states: string[];
  stateIsos?: string[];
};

type CodSettings = {
  enabled: boolean;
  everywhere: boolean;
  rules: CodRule[];
};

function SettingsPage() {
  const [settings, setSettings] = useState<CodSettings>({
    enabled: true,
    everywhere: true,
    rules: [],
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const [countryIso, setCountryIso] = useState("US");
  const [countryName, setCountryName] = useState("United States");
  const [scope, setScope] = useState<"country" | "states">("country");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedStateIsos, setSelectedStateIsos] = useState<string[]>([]);
  const [stateQuery, setStateQuery] = useState("");
  const statesScrollRef = useRef<HTMLUListElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);

  // Wheel on the left pane scrolls the states list (right), not the page.
  useEffect(() => {
    const left = leftPaneRef.current;
    if (!left) return;
    const onWheel = (e: WheelEvent) => {
      if (scope !== "states") return;
      const el = statesScrollRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 1) return;
      e.preventDefault();
      el.scrollTop += e.deltaY;
    };
    left.addEventListener("wheel", onWheel, { passive: false });
    return () => left.removeEventListener("wheel", onWheel);
  }, [scope]);

  const stateOptions = useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso).map((s) => ({
      name: s.name,
      iso: s.isoCode,
    }));
  }, [countryIso]);

  const filteredStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) return stateOptions;
    return stateOptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.iso.toLowerCase().includes(q)
    );
  }, [stateOptions, stateQuery]);

  const existingForCountry = useMemo(
    () => settings.rules.find((r) => r.countryIso === countryIso) || null,
    [settings.rules, countryIso]
  );

  useEffect(() => {
    void api<CodSettings>("/api/v1/admin/settings/cod")
      .then((data) => {
        const next = {
          enabled: data.enabled,
          everywhere: data.everywhere,
          rules: data.rules || [],
        };
        setSettings(next);
        const first = next.rules[0];
        if (first) {
          loadCountryIntoEditor(first);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, []);

  const loadCountryIntoEditor = (rule: CodRule) => {
    setCountryIso(rule.countryIso);
    setCountryName(rule.countryName || rule.countryIso);
    setScope(rule.scope === "states" ? "states" : "country");
    setSelectedStates(rule.states || []);
    setSelectedStateIsos(rule.stateIsos || []);
    setStateQuery("");
  };

  const pickCountry = (iso: string, name: string) => {
    setCountryIso(iso);
    setCountryName(name);
    setStateQuery("");
    const existing = settings.rules.find((r) => r.countryIso === iso);
    if (existing) {
      setScope(existing.scope === "states" ? "states" : "country");
      setSelectedStates(existing.states || []);
      setSelectedStateIsos(existing.stateIsos || []);
    } else {
      setScope("country");
      setSelectedStates([]);
      setSelectedStateIsos([]);
    }
  };

  const persist = (next: CodSettings, message = "Saved.") => {
    setBusy(true);
    setError("");
    setSaved("");
    void api<CodSettings>("/api/v1/admin/settings/cod", {
      method: "PUT",
      body: JSON.stringify(next),
    })
      .then((data) => {
        setSettings({
          enabled: data.enabled,
          everywhere: data.everywhere,
          rules: data.rules || [],
        });
        setSaved(message);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not save")
      )
      .finally(() => setBusy(false));
  };

  const saveCountryRule = () => {
    if (scope === "states" && selectedStates.length === 0) {
      setError("Select at least one state, or switch to entire country.");
      return;
    }
    if (scope === "states" && stateOptions.length === 0) {
      setError("This country has no states — use entire country.");
      return;
    }
    const rule: CodRule = {
      countryIso,
      countryName,
      scope,
      states: scope === "states" ? selectedStates : [],
      stateIsos: scope === "states" ? selectedStateIsos : [],
    };
    const next: CodSettings = {
      ...settings,
      everywhere: false,
      rules: [
        ...settings.rules.filter((r) => r.countryIso !== countryIso),
        rule,
      ],
    };
    persist(next, `Updated COD for ${countryName}.`);
  };

  const removeCountryRule = (iso: string) => {
    const next = {
      ...settings,
      rules: settings.rules.filter((r) => r.countryIso !== iso),
    };
    persist(next, "Region removed.");
    if (iso === countryIso) {
      setSelectedStates([]);
      setSelectedStateIsos([]);
      setScope("country");
    }
  };

  const toggleState = (name: string, iso: string) => {
    setScope("states");
    setSelectedStates((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
    setSelectedStateIsos((prev) =>
      prev.includes(iso) ? prev.filter((x) => x !== iso) : [...prev, iso]
    );
  };

  const selectAllStates = () => {
    setScope("states");
    setSelectedStates(stateOptions.map((s) => s.name));
    setSelectedStateIsos(stateOptions.map((s) => s.iso));
  };

  const clearStates = () => {
    setSelectedStates([]);
    setSelectedStateIsos([]);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Platform settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Control cash on delivery by country and state. Checkout only shows
            COD when the customer’s shipping address matches.
          </p>
        </div>
        {saved ? (
          <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800">
            {saved}
          </p>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(18,16,14,0.05)] lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Cash on delivery</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              Master switch for the whole platform.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              persist(
                { ...settings, enabled: !settings.enabled },
                settings.enabled ? "COD turned off." : "COD turned on."
              )
            }
            className={cn(
              "rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition",
              settings.enabled
                ? "bg-emerald-600 text-white"
                : "bg-stone-200 text-stone-600"
            )}
          >
            {settings.enabled ? "COD on" : "COD off"}
          </button>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2">
          <button
            type="button"
            disabled={busy || !settings.enabled}
            onClick={() =>
              persist(
                { ...settings, everywhere: true },
                "COD available everywhere."
              )
            }
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition disabled:opacity-40",
              settings.everywhere
                ? "border-[var(--orange)] bg-[var(--orange)]/10"
                : "border-[var(--line)] hover:border-[var(--ink)]/25"
            )}
          >
            <p className="text-[14px] font-semibold">Everywhere</p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              COD for any shipping country / state
            </p>
          </button>
          <button
            type="button"
            disabled={busy || !settings.enabled}
            onClick={() =>
              persist(
                { ...settings, everywhere: false },
                "COD limited to selected regions."
              )
            }
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition disabled:opacity-40",
              !settings.everywhere
                ? "border-[var(--orange)] bg-[var(--orange)]/10"
                : "border-[var(--line)] hover:border-[var(--ink)]/25"
            )}
          >
            <p className="text-[14px] font-semibold">Selected regions only</p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              Limit COD to countries or specific states
            </p>
          </button>
        </div>
      </section>

      {settings.enabled && !settings.everywhere ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] xl:items-start">
          {/* LEFT — country + saved list */}
          <div ref={leftPaneRef} className="space-y-4 xl:sticky xl:top-4">
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(18,16,14,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                1 · Choose country
              </p>
              <div className="mt-3">
                <FlagCountrySelect
                  value={countryIso}
                  onChange={(c) => pickCountry(c.iso, c.name)}
                  label=""
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScope("country");
                    setSelectedStates([]);
                    setSelectedStateIsos([]);
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide",
                    scope === "country"
                      ? "bg-[var(--ink)] text-white"
                      : "bg-[var(--soft)] text-[var(--muted)]"
                  )}
                >
                  Entire country
                </button>
                <button
                  type="button"
                  disabled={stateOptions.length === 0}
                  onClick={() => setScope("states")}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide disabled:opacity-40",
                    scope === "states"
                      ? "bg-[var(--orange)] text-[var(--ink)]"
                      : "bg-[var(--soft)] text-[var(--muted)]"
                  )}
                >
                  Specific states
                </button>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
                Select the country first. Use entire country, or switch to
                specific states — the list appears on the right.
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={saveCountryRule}
                className="mt-4 h-11 w-full rounded-full bg-[var(--ink)] px-6 text-[12px] font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--forest)] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save country"}
              </button>
            </section>

            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(18,16,14,0.05)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  COD regions
                </p>
                <span className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--ink)]">
                  {settings.rules.length}
                </span>
              </div>

              {settings.rules.length === 0 ? (
                <p className="mt-4 text-[13px] text-[var(--muted)]">
                  No countries yet. Pick a country on the left, then Save.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {settings.rules.map((rule) => {
                    const active = rule.countryIso === countryIso;
                    return (
                      <li
                        key={rule.countryIso}
                        className={cn(
                          "rounded-2xl border px-3.5 py-3 transition",
                          active
                            ? "border-[var(--orange)] bg-[var(--orange)]/8"
                            : "border-[var(--line)] bg-[var(--soft)]/40"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-[22px] leading-none">
                            {flagEmoji(rule.countryIso)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-[var(--ink)]">
                              {rule.countryName || rule.countryIso}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                              {rule.scope === "states"
                                ? `${rule.states.length} state${rule.states.length === 1 ? "" : "s"} · ${rule.states.slice(0, 3).join(", ")}${rule.states.length > 3 ? "…" : ""}`
                                : "Entire country"}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => loadCountryIntoEditor(rule)}
                              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Remove"
                              disabled={busy}
                              onClick={() =>
                                removeCountryRule(rule.countryIso)
                              }
                              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-white hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* RIGHT — states (own scroll; left-column wheel also drives this) */}
          <section className="flex h-[min(72vh,760px)] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_8px_30px_rgba(18,16,14,0.05)] xl:sticky xl:top-4">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  2 · States of {countryName}
                </p>
                <h3 className="mt-0.5 truncate text-[17px] font-semibold text-[var(--ink)]">
                  {flagEmoji(countryIso)} {countryName}
                </h3>
              </div>
              {scope === "states" ? (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={selectAllStates}
                    disabled={stateOptions.length === 0}
                    className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide disabled:opacity-40"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={clearStates}
                    disabled={selectedStates.length === 0}
                    className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            {scope === "country" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--soft)]/40 px-6 py-16 text-center">
                <MapPin className="size-8 text-[var(--orange)]" />
                <p className="text-[15px] font-semibold text-[var(--ink)]">
                  Entire country selected
                </p>
                <p className="max-w-sm text-[13px] text-[var(--muted)]">
                  COD covers all of {countryName}. Choose{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    Specific states
                  </span>{" "}
                  on the left if you only want some regions — they’ll show up
                  here.
                </p>
              </div>
            ) : stateOptions.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-[13px] text-[var(--muted)]">
                No state list for this country — use entire country.
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-[var(--line)] px-4 py-2.5">
                  <input
                    value={stateQuery}
                    onChange={(e) => setStateQuery(e.target.value)}
                    placeholder="Search states…"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)]/50 px-3.5 text-[13px] outline-none focus:border-[var(--orange)] focus:bg-white"
                  />
                  <p className="mt-2 text-[11px] text-[var(--muted)]">
                    {selectedStates.length} selected · {stateOptions.length}{" "}
                    total — scroll here or from the left panel
                  </p>
                </div>
                <ul
                  ref={statesScrollRef}
                  className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 content-start gap-1.5 overflow-y-auto overscroll-contain p-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredStates.map((s) => {
                    const on = selectedStates.includes(s.name);
                    return (
                      <li key={s.iso}>
                        <button
                          type="button"
                          onClick={() => toggleState(s.name, s.iso)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                            on
                              ? "border-[var(--orange)] bg-[var(--orange)]/12 shadow-sm"
                              : "border-[var(--line)] bg-[var(--soft)]/30 hover:border-[var(--ink)]/20 hover:bg-white"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md border",
                              on
                                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                                : "border-[var(--line)] bg-white"
                            )}
                          >
                            {on ? <Check className="size-3" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
                              {s.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                              {s.iso}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default function Page() {
  return (
    <Shell>
      <SettingsPage />
    </Shell>
  );
}
