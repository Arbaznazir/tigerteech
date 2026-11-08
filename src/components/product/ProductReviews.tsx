"use client";

import { BadgeCheck, Star } from "lucide-react";
import type { Product } from "@/data/products";
import { cn } from "@/lib/cn";

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProductReviews({ product }: { product: Product }) {
  const reviews = product.reviews;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct =
      reviews.length === 0 ? 0 : Math.round((count / reviews.length) * 100);
    return { stars, count, pct };
  });

  return (
    <section
      id="reviews"
      className="border-t border-line bg-soft/70"
      aria-labelledby="reviews-heading"
    >
      <div className="container-site py-14 md:py-20">
        <div className="mb-10 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Tribe feedback
            </p>
            <h2
              id="reviews-heading"
              className="font-display mt-2 text-4xl tracking-[0.04em] text-ink md:text-5xl"
            >
              Reviews
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Real wear notes from the Tigerteeh tribe on {product.name}.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-14">
          {/* Summary */}
          <aside className="rounded-[1.5rem] border border-line bg-paper p-6 shadow-[0_16px_40px_rgba(22,20,18,0.06)] md:p-8">
            <div className="flex items-end gap-3">
              <span className="font-display text-6xl leading-none text-ink">
                {product.rating.toFixed(1)}
              </span>
              <div className="mb-1.5">
                <div className="flex items-center gap-0.5 text-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4",
                        i < Math.round(product.rating)
                          ? "fill-orange text-orange"
                          : "fill-transparent text-line"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-muted">
                  Based on {product.reviewCount} reviews
                </p>
              </div>
            </div>

            <ul className="mt-8 space-y-2.5">
              {distribution.map(({ stars, pct }) => (
                <li key={stars} className="flex items-center gap-3 text-xs font-semibold">
                  <span className="w-6 tabular-nums text-ink">{stars}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-orange"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-muted">{pct}%</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-2xl bg-forest px-4 py-3 text-[12px] font-semibold leading-relaxed text-white/90">
              Purchases help fund animal rescue, medical care, and cage-free
              sanctuaries — wear wild, give back.
            </p>
          </aside>

          {/* Review cards */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[1.35rem] border border-line bg-paper p-5 shadow-[0_10px_28px_rgba(22,20,18,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(22,20,18,0.08)] md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{review.author}</p>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest">
                          <BadgeCheck className="size-3" strokeWidth={2.5} />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted">
                      {formatReviewDate(review.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 text-orange">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < review.rating
                            ? "fill-orange text-orange"
                            : "fill-transparent text-line"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="mt-4 font-display text-2xl tracking-[0.04em] text-ink">
                  {review.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {review.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
