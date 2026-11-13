import { Flame } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: string;
  href?: string;
  showFlame?: boolean;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  href = "/shop",
  showFlame,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange">
            {showFlame && <Flame className="size-3.5 fill-orange text-orange" />}
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-4xl tracking-wide text-ink md:text-5xl">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button href={href} variant="ghost" size="sm" className="border border-line">
          View All
        </Button>
      </div>
    </div>
  );
}
