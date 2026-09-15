import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { cn } from "@/lib/cn";

export type InfoBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "qa"; q: string; a: string }
  | { type: "h3"; text: string }
  | { type: "note"; text: string };

type Props = {
  eyebrow: string;
  title: string;
  accent?: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
};

export function InfoPageShell({
  eyebrow,
  title,
  accent,
  lead,
  children,
  className,
}: Props) {
  return (
    <div className={cn("bg-[#f7f5f2]", className)}>
      <div className="border-b border-line bg-white">
        <div className="container-site py-8 md:py-12">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-orange"
          >
            <ArrowLeft className="size-3.5" />
            Back home
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.92] tracking-wide text-forest">
            {title}{" "}
            {accent ? (
              <span className="text-wild text-[clamp(2.6rem,9vw,4.75rem)]">
                {accent}
              </span>
            ) : null}
          </h1>
          {lead ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              {lead}
            </p>
          ) : null}
        </div>
      </div>

      <div className="container-site py-8 pb-16 md:py-12 md:pb-20">
        <div className="mx-auto max-w-3xl md:max-w-4xl">{children}</div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-forest/10 bg-forest px-5 py-6 text-white md:mt-12 md:max-w-4xl md:px-7 md:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            Need help?
          </p>
          <p className="mt-2 font-display text-3xl tracking-wide md:text-4xl">
            We&apos;re here for the tribe
          </p>
          <a
            href="mailto:support@tigerteehclothing.com"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#111] transition hover:bg-[#ff9f4a]"
          >
            <Mail className="size-4" strokeWidth={2.25} />
            support@tigerteehclothing.com
          </a>
          <p className="mt-3 text-xs text-white/55">
            Store: Tigerteeh Office, Pader Street, Dadhal Inam, Taluka
            Ankleshwar, Dist Bharuch, PIN 393001
          </p>
        </div>
      </div>
    </div>
  );
}

export function InfoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white p-5 shadow-[0_8px_28px_rgba(6,35,26,0.05)] md:p-7",
        className
      )}
    >
      {children}
    </div>
  );
}

export function InfoBlocks({ blocks }: { blocks: InfoBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.type === "p") {
          return (
            <p key={i} className="text-sm leading-relaxed text-muted md:text-[15px]">
              {b.text}
            </p>
          );
        }
        if (b.type === "h3") {
          return (
            <h2
              key={i}
              className="pt-2 font-display text-2xl tracking-wide text-forest md:text-3xl"
            >
              {b.text}
            </h2>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {b.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted md:text-[15px]"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "note") {
          return (
            <p
              key={i}
              className="rounded-xl bg-soft px-4 py-3 text-sm leading-relaxed text-ink/80"
            >
              {b.text}
            </p>
          );
        }
        return (
          <div
            key={i}
            className="rounded-xl border border-line/80 bg-soft/60 px-4 py-4 md:px-5"
          >
            <p className="text-sm font-bold text-forest md:text-[15px]">{b.q}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted md:text-[15px]">
              {b.a}
            </p>
          </div>
        );
      })}
    </div>
  );
}
