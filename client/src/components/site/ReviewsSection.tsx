import { Quote, Star } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { useReviews } from "@/features/public/hooks";
import type { PublicReview } from "@/features/public/types";
import { cn } from "@/lib/cn";
import { CardGridSkeleton } from "./QueryStates";
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
    <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <Quote aria-hidden="true" className="size-6 text-brand-100" />
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

/** Shown on the Reviews page when nobody has reviewed yet. We never display made-up reviews. */
export function ReviewsEmpty() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center sm:px-10">
      <h3 className="font-display text-2xl font-semibold text-ink">Your experience matters.</h3>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Reviews from our learners will appear here. Have a question before you begin? We&apos;re
        happy to help.
      </p>
      <Link to="/contact" className={`${buttonStyles({ variant: "primary", size: "lg" })} mt-7`}>
        Talk to us
      </Link>
    </div>
  );
}

/** Approved reviews from `GET /public/reviews`. */
export function ReviewsGrid({ limit }: { limit?: number }) {
  const { data, isPending } = useReviews();
  if (isPending) return <CardGridSkeleton count={3} />;
  if (!data || data.length === 0) return <ReviewsEmpty />;
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
