"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-ink">Name</span>
        <input
          required
          name="name"
          className="w-full rounded-xl border border-line bg-[#faf9f7] px-3.5 py-3 outline-none transition focus:border-forest/30 focus:ring-2 focus:ring-orange/20"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-ink">Email</span>
        <input
          required
          type="email"
          name="email"
          className="w-full rounded-xl border border-line bg-[#faf9f7] px-3.5 py-3 outline-none transition focus:border-forest/30 focus:ring-2 focus:ring-orange/20"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-ink">Message</span>
        <textarea
          required
          name="message"
          rows={5}
          className="w-full resize-y rounded-xl border border-line bg-[#faf9f7] px-3.5 py-3 outline-none transition focus:border-forest/30 focus:ring-2 focus:ring-orange/20"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-forest text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0a3428] active:scale-[0.99]"
      >
        Send Message
      </button>
      {sent ? (
        <p className="text-center text-sm text-orange">
          Message saved locally — we&apos;ll be in touch (demo).
        </p>
      ) : null}
    </form>
  );
}
