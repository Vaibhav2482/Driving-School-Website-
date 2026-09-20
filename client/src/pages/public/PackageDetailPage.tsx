import { Check, ChevronRight, Clock, Layers, MessageCircle, Phone } from "lucide-react";
import { Link, useParams } from "react-router";
import { Seo } from "@/components/common/Seo";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { Skeleton } from "@/components/ui/Skeleton";
import { Container } from "@/components/site/Container";
import { FinalCta } from "@/components/site/FinalCta";
import { NotFoundState } from "@/components/site/NotFoundState";
import { LoadError } from "@/components/site/QueryStates";
import { Section } from "@/components/site/Section";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo, usePackage } from "@/features/public/hooks";
import {
  formatLessonDuration,
  formatLessons,
  formatPackagePrice,
  formatValidity,
  vehicleTypeLabel,
} from "@/features/public/labels";
import { ApiError } from "@/lib/apiClient";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

const META_DESCRIPTION_LENGTH = 155;

function DetailSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading plan">
      <div className="bg-brand-950 py-16">
        <Container>
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="mt-5 h-12 w-2/3 bg-white/10" />
        </Container>
      </div>
      <Container className="py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
      </Container>
    </div>
  );
}

export function PackageDetailPage() {
  const { slug = "" } = useParams();
  const business = useBusinessInfo();
  const { data: pkg, isPending, isError, error, refetch } = usePackage(slug);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <>
          <Seo title="Package not found" noIndex />
          <NotFoundState
            title="We couldn't find that package"
            message="It may no longer be available. See our current plans, or contact us and we'll help you choose."
            primaryAction={{ to: "/packages", label: "See all packages" }}
          />
        </>
      );
    }
    return (
      <Section tone="canvas">
        <LoadError what="this package" onRetry={() => void refetch()} />
      </Section>
    );
  }

  const price = formatPackagePrice(pkg);
  const validity = formatValidity(pkg.validityDays);
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);
  const description =
    pkg.description?.slice(0, META_DESCRIPTION_LENGTH) ??
    `${pkg.name}: ${formatLessons(pkg.lessonCount)} of ${formatLessonDuration(pkg.lessonDurationMinutes)} each at Sri Sai Balaji Driving School, Hyderabad.`;

  return (
    <>
      <Seo title={pkg.name} description={description} path={`/packages/${pkg.slug}`} />

      <div className="bg-brand-950 text-white">
        <Container className="py-12 sm:py-16">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-sm text-brand-200"
          >
            <Link to="/packages" className="hover:text-white">
              Packages
            </Link>
            <ChevronRight aria-hidden="true" className="size-4" />
            <span aria-current="page" className="text-white">
              {pkg.name}
            </span>
          </nav>
          <Badge tone="inverse">{vehicleTypeLabel(pkg.vehicleType)}</Badge>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            {pkg.name}
          </h1>
        </Container>
      </div>

      <Section tone="white" className="!py-12 sm:!py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            {pkg.description && (
              <>
                <h2 className="font-display text-2xl font-semibold text-ink">About this plan</h2>
                <p className="mt-4 text-lg leading-relaxed whitespace-pre-line text-muted">
                  {pkg.description}
                </p>
              </>
            )}

            {pkg.features.length > 0 && (
              <>
                <h2
                  className={`${pkg.description ? "mt-12" : ""} font-display text-2xl font-semibold text-ink`}
                >
                  What&apos;s included
                </h2>
                <ul className="mt-5 grid gap-3.5 sm:grid-cols-2">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 rounded-xl border border-line bg-canvas p-4"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-success-700"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Design for absence: with no description or features yet, never leave the column empty. */}
            {!pkg.description && pkg.features.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line-strong bg-canvas p-7 sm:p-9">
                <h2 className="font-display text-2xl font-semibold text-ink">Want to know more?</h2>
                <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
                  Send us an enquiry or give us a call and we&apos;ll take you through this plan and
                  what it includes.
                </p>
              </div>
            )}
          </div>

          <aside aria-label="Plan summary" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-line bg-canvas p-6 sm:p-7">
              {price ? (
                <p className="font-display text-4xl font-semibold tracking-tight text-brand-900">
                  {price}
                </p>
              ) : (
                <p className="font-display text-2xl font-semibold text-brand-900">
                  Price on request
                </p>
              )}

              <dl className="mt-6 space-y-3.5 border-t border-line pt-6 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-muted">
                    <Layers aria-hidden="true" className="size-4 text-brand-500" />
                    Lessons
                  </dt>
                  <dd className="font-medium text-ink">{pkg.lessonCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-muted">
                    <Clock aria-hidden="true" className="size-4 text-brand-500" />
                    Each lesson
                  </dt>
                  <dd className="font-medium text-ink">
                    {formatLessonDuration(pkg.lessonDurationMinutes)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Vehicle</dt>
                  <dd className="font-medium text-ink">{vehicleTypeLabel(pkg.vehicleType)}</dd>
                </div>
                {validity && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Valid for</dt>
                    <dd className="font-medium text-ink">{validity}</dd>
                  </div>
                )}
              </dl>

              <Link
                to={`/book?package=${encodeURIComponent(pkg.slug)}`}
                className={`${buttonStyles({ variant: "accent", size: "lg", fullWidth: true })} mt-7`}
              >
                Book this plan
              </Link>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {whatsapp && (
                  <a
                    href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.package(pkg.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles({ variant: "secondary", size: "md", fullWidth: true })}
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    WhatsApp
                  </a>
                )}
                {phone && (
                  <a
                    href={telHref(phone)}
                    className={buttonStyles({ variant: "secondary", size: "md", fullWidth: true })}
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    <span className="sr-only">Call </span>
                    {formatPhone(phone)}
                  </a>
                )}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted">
                Booking here sends us an enquiry. We&apos;ll contact you to arrange your lessons.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
