"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { PhoneCountryInput } from "@/components/ui/PhoneCountryInput";
import { StateSelect } from "@/components/ui/StateSelect";
import { API_URL } from "@/lib/api";
import {
  findCountryByIso,
  formatInternational,
  parseStoredPhone,
} from "@/lib/countries";
import { countryIsoForCurrency } from "@/lib/currency";
import { getCustomerToken } from "@/lib/customer-auth";
import { resolveMediaUrl } from "@/lib/media";
import { useStore } from "@/lib/store";

export function ProfileEditor() {
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const updateProfile = useStore((s) => s.updateProfile);
  const refreshProfile = useStore((s) => s.refreshProfile);
  const currency = useStore((s) => s.currency);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void refreshProfile();
  }, [user?.id, refreshProfile]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setGender(
      user.gender === "male" || user.gender === "female" ? user.gender : ""
    );
    setPhone(user.phone || "");
    setAvatarUrl(user.avatarUrl || "");
    const a = user.address || {};
    setAddress({
      fullName: a.fullName || user.name || "",
      address: a.address || "",
      city: a.city || "",
      state: a.state || "",
      zip: a.zip || "",
      country: a.country || "United States",
    });
  }, [user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    const c = findCountryByIso(countryIsoForCurrency(currency));
    if (!c) return;
    setAddress((a) =>
      a.country === c.name ? a : { ...a, country: c.name, state: "" }
    );
    setPhone((prev) =>
      formatInternational(c.dial, parseStoredPhone(prev).national)
    );
  }, [hydrated, user, currency]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    const error = await updateProfile({
      name,
      phone,
      avatarUrl,
      gender: gender || undefined,
      address: { ...address, fullName: name },
    });
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    setMsg("Profile saved.");
  };

  const onAvatar = async (file: File | null) => {
    if (!file || !user) return;
    const token = getCustomerToken();
    if (!token) {
      setErr("Please log in again.");
      return;
    }
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/v1/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = (await res.json()) as {
        data?: { url: string };
        error?: string | null;
      };
      if (!res.ok || json.error || !json.data?.url) {
        throw new Error(json.error || "Upload failed");
      }
      const url = json.data.url;
      setAvatarUrl(url);
      const saveErr = await updateProfile({
        name,
        phone,
        avatarUrl: url,
        address,
      });
      if (saveErr) throw new Error(saveErr);
      setMsg("Photo updated.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-line bg-paper p-6">
      <h2 className="font-display text-3xl">Edit Profile</h2>
      <p className="mt-1 text-sm text-muted">
        Address and phone are used at checkout and shown to the seller.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-line bg-soft">
          {avatarUrl ? (
            <img
              src={resolveMediaUrl(avatarUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted">No photo</span>
          )}
        </div>
        <label className="cursor-pointer text-sm font-semibold text-orange">
          {uploading ? "Uploading…" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void onAvatar(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <form onSubmit={onSave} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Name *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
          />
        </label>
        <fieldset className="block text-sm">
          <legend className="mb-1.5 block font-medium">Gender</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["male", "Male"],
                ["female", "Female"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                  gender === value
                    ? "border-orange bg-orange/10 text-ink"
                    : "border-line bg-white text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <PhoneCountryInput
          value={phone}
          countryName={address.country}
          onPhoneChange={(international) => setPhone(international)}
          onCountryChange={(c) => {
            setAddress((a) => ({
              ...a,
              country: c.name,
              state: a.country === c.name ? a.state : "",
            }));
            setPhone(
              formatInternational(c.dial, parseStoredPhone(phone).national)
            );
          }}
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Street address</span>
          <input
            value={address.address}
            onChange={(e) =>
              setAddress((a) => ({ ...a, address: e.target.value }))
            }
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">City</span>
            <input
              value={address.city}
              onChange={(e) =>
                setAddress((a) => ({ ...a, city: e.target.value }))
              }
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
            />
          </label>
          <StateSelect
            countryName={address.country}
            value={address.state}
            onChange={(state) => setAddress((a) => ({ ...a, state }))}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">ZIP</span>
            <input
              value={address.zip}
              onChange={(e) =>
                setAddress((a) => ({ ...a, zip: e.target.value }))
              }
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5"
            />
          </label>
          <CountrySelect
            value={address.country}
            onChange={(c) => {
              setAddress((a) => ({
                ...a,
                country: c.name,
                state: a.country === c.name ? a.state : "",
              }));
              setPhone(
                formatInternational(
                  c.dial,
                  parseStoredPhone(phone).national
                )
              );
            }}
          />
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {msg ? <p className="text-sm text-orange">{msg}</p> : null}
        <Button type="submit" variant="forest" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </section>
  );
}
