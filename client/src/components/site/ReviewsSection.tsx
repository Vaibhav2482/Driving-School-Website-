import { Quote, Star } from "lucide-react";
import { useReviews } from "@/features/public/hooks";
import type { PublicReview } from "@/features/public/types";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

function Stars({ rating }: { rating: number }) {
  return (
    <div role="img" aria-label={`Rated ${rating} out of 5`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "size-4",
            n <= rating ? "fill-signal-400 text-signal-500" : "text-sand-300",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-line bg-surface p-7 sm:p-8">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <Quote aria-hidden="true" className="size-6 text-accent-200" />
      </div>
      <blockquote className="mt-4 leading-relaxed whitespace-pre-line text-ink">
        {review.body}
      </blockquote>
      <figcaption className="mt-auto pt-5 text-sm font-semibold text-brand-900">
        {review.authorName}
      </figcaption>
    </figure>
  );
}

/** Reviews from the site content. */
export function ReviewsGrid({ limit }: { limit?: number }) {
  const { data } = useReviews();
  if (data.length === 0) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {(limit ? data.slice(0, limit) : data).map((review, index) => (
        <Reveal key={`${review.authorName}-${index}`} delay={index * 60} className="h-full">
          <ReviewCard review={review} />
        </Reveal>
      ))}
    </div>
  );
}
