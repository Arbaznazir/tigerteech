"use client";

import { useEffect, useState } from "react";
import { MapPin, Ruler, Sparkles, X } from "lucide-react";
import {
  currencyForCountryIso,
  defaultUsNewYork,
  getShopperLocation,
  hasSeenWelcomeCustom,
  markWelcomeCustomSeen,
  requestBrowserLocation,
  reverseGeocode,
  setShopperLocation,
} from "@/lib/location";
import { useStore } from "@/lib/store";

type Step = "welcome" | "location" | null;

export function OnboardingModals() {
  const setCurrency = useStore((s) => s.setCurrency);
  const [step, setStep] = useState<Step>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Don't wait on cart/store hydration — popups must show on first paint.
    const params = new URLSearchParams(window.location.search);
    const forceOnboard = params.get("onboard") === "1";
    if (forceOnboard) {
      try {
        localStorage.removeItem("tt:welcome-custom-seen");
        localStorage.removeItem("tt:shopper-location");
      } catch {
        /* ignore */
      }
    }

    if (forceOnboard || !hasSeenWelcomeCustom()) {
      // Seed US / New York until they allow or skip location.
      const loc = getShopperLocation();
      if (forceOnboard || !loc.updatedAt) {
        setShopperLocation({
          ...defaultUsNewYork({ consented: false }),
          updatedAt: Date.now(),
        });
      }
      setStep("welcome");
      return;
    }
    const loc = getShopperLocation();
    if (!loc.consented) setStep("location");
  }, []);

  const finishWelcome = () => {
    markWelcomeCustomSeen();
    const loc = getShopperLocation();
    if (!loc.consented) {
      setStep("location");
      return;
    }
    setStep(null);
  };

  const skipLocation = () => {
    setShopperLocation(defaultUsNewYork());
    setCurrency("USD");
    setStep(null);
  };

  const allowLocation = async () => {
    setBusy(true);
    setError("");
    try {
      const pos = await requestBrowserLocation();
      const geo = await reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude
      );
      setShopperLocation({
        countryIso: geo.countryIso,
        countryName: geo.countryName,
        stateName: geo.stateName || "",
        cityName: geo.cityName || "",
        source: "geo",
        consented: true,
        updatedAt: Date.now(),
      });
      const cur = currencyForCountryIso(geo.countryIso);
      if (cur) setCurrency(cur);
      setStep(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Location permission denied. You can keep shopping with US · New York offers."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!step) return null;

  if (step === "welcome") {
    return (
      <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          aria-label="Dismiss"
          className="absolute inset-0 bg-ink/50 backdrop-blur-[3px]"
          onClick={finishWelcome}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/10 shadow-[0_32px_90px_rgba(10,9,8,0.45)]"
        >
          <div className="relative bg-[#0A0908] px-6 pb-6 pt-5 text-[#FAF9F7] sm:px-8 sm:pb-8 sm:pt-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 15% 0%, rgba(243,129,32,0.45), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(196,165,116,0.18), transparent 50%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-28deg, transparent, transparent 10px, rgba(250,249,247,0.9) 10px, rgba(250,249,247,0.9) 11px)",
              }}
            />

            <div className="relative flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange">
                <Sparkles className="size-3" strokeWidth={2.25} />
                Made for you
              </span>
              <button
                type="button"
                onClick={finishWelcome}
                className="rounded-full p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <h3
              id="welcome-title"
              className="relative mt-5 font-display text-[clamp(2rem,6vw,2.75rem)] leading-[0.95] tracking-wide"
            >
              EVERYTHING IS{" "}
              <span className="block text-[clamp(2.15rem,6.5vw,3rem)] font-bold tracking-[0.04em] text-orange">
                TAILORED
              </span>
            </h3>
            <p className="relative mt-4 max-w-md text-[14px] leading-relaxed text-white/72 sm:text-[15px]">
              Everything you get from our store is customized and tailored —
              made for you. For your size, your fit, your comfort. Not generic
              off-the-rack — built so it feels like it was always yours.
            </p>

            <ul className="relative mt-5 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: Ruler, label: "Your size" },
                { icon: Sparkles, label: "Your comfort" },
                { icon: MapPin, label: "Your fit" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                >
                  <Icon className="size-3.5 shrink-0 text-orange" strokeWidth={2.25} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={finishWelcome}
              className="relative mt-6 h-12 w-full rounded-full bg-orange text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-[#FF9A3C]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={skipLocation}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-[0_28px_80px_rgba(18,16,14,0.28)]"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-ink">
            <MapPin className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="loc-title"
              className="text-[17px] font-semibold tracking-tight text-ink"
            >
              Allow location for offers?
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Please allow location so we can check whether you are eligible for
              deals, offers, and cash on delivery in your country and state. We
              only use country and state — not an exact address.
            </p>
          </div>
          <button
            type="button"
            onClick={skipLocation}
            className="rounded-full p-1.5 text-muted transition hover:bg-soft hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        {error ? (
          <p className="border-b border-line px-5 py-2 text-[12px] text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 bg-soft/40 px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={skipLocation}
            className="h-10 rounded-full border border-line bg-white px-4 text-[12px] font-semibold uppercase tracking-wide text-ink disabled:opacity-50"
          >
            Not yet
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void allowLocation()}
            className="h-10 rounded-full bg-orange px-5 text-[12px] font-semibold uppercase tracking-wide text-ink disabled:opacity-50"
          >
            {busy ? "Finding…" : "Allow location"}
          </button>
        </div>
      </div>
    </div>
  );
}
