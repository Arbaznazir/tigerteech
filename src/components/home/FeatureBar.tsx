import { Headphones, Leaf, Package, Truck } from "lucide-react";

const items = [
  { icon: Leaf, title: "100% Natural Fabrics" },
  { icon: Truck, title: "Fast Shipping" },
  { icon: Package, title: "Easy Returns" },
  { icon: Headphones, title: "24/7 Support" },
];

export function FeatureBar() {
  const strip = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-line bg-soft">
      <div className="relative flex h-8 items-center md:h-9">
        <div className="feature-marquee flex w-max items-center gap-8 whitespace-nowrap px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink md:gap-10 md:text-[11px]">
          {strip.map(({ icon: Icon, title }, i) => (
            <span
              key={`${title}-${i}`}
              className="inline-flex items-center gap-2 text-ink/85"
            >
              <Icon
                className="size-3 shrink-0 text-orange md:size-3.5"
                strokeWidth={2}
              />
              {title}
              <span className="text-ink/20" aria-hidden>
                •
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
