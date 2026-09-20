import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { FormField } from "@/components/common/FormField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getWhatsappNumber } from "@/features/public/business";
import {
  useBranches,
  useBusinessInfo,
  useCreateEnquiry,
  usePackages,
} from "@/features/public/hooks";
import { ApiError } from "@/lib/apiClient";
import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { todayInBusinessTimezone } from "@/lib/time";
import {
  enquiryFormSchema,
  TIME_WINDOW_OPTIONS,
  toEnquiryPayload,
  type EnquiryFormValues,
} from "./schema";

const FIELD_NAMES = new Set<keyof EnquiryFormValues>([
  "fullName",
  "phone",
  "packageSlug",
  "preferredBranchSlug",
  "preferredDate",
  "preferredTimeWindow",
  "pickupAddress",
  "message",
  "consent",
]);

/** Starting message when a visitor arrives from the Pickup or RTA sections. */
function initialMessage(params: URLSearchParams): string {
  if (params.get("pickup"))
    return "I'd like to check house pickup & drop availability for my area.";
  if (params.get("topic") === "rta") return "I need guidance with an RTA-related process.";
  return "";
}

function EnquirySuccess() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const whatsapp = getWhatsappNumber(useBusinessInfo());

  // Move focus to the confirmation so screen-reader users hear it.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div role="status" className="py-6 text-center sm:py-10">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-50 text-success-700">
        <CheckCircle2 aria-hidden="true" className="size-9" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-2xl font-semibold text-ink outline-none sm:text-3xl"
      >
        Thanks! Your enquiry has been received.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">We&apos;ll contact you shortly.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/" className={buttonStyles({ variant: "primary", size: "md" })}>
          Back to home
        </Link>
        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Message us on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * The public enquiry form. This is an ENQUIRY, not a confirmed booking: staff contact the visitor to
 * arrange the lesson. Fields, validation and the honeypot mirror the API contract (POST /public/enquiries).
 */
export function EnquiryForm() {
  const [params] = useSearchParams();
  const { data: packages } = usePackages();
  const { data: branches } = useBranches();
  const { mutateAsync, isSuccess, error } = useCreateEnquiry();
  const requestedPackage = params.get("package") ?? "";

  const defaultValues = useMemo<EnquiryFormValues>(
    () => ({
      fullName: "",
      phone: "",
      packageSlug: "",
      preferredBranchSlug: "",
      preferredDate: "",
      preferredTimeWindow: "",
      pickupAddress: "",
      message: initialMessage(params),
      consent: false,
      website: "",
    }),
    // Prefill only from the URL the visitor arrived with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues,
    // We focus the first invalid field ourselves (in visual order), see onInvalid below.
    shouldFocusError: false,
  });

  // Preselect the plan from `?package=slug` once the plan list has loaded (only if that plan exists).
  useEffect(() => {
    if (requestedPackage && packages?.some((pkg) => pkg.slug === requestedPackage)) {
      setValue("packageSlug", requestedPackage);
    }
  }, [packages, requestedPackage, setValue]);

  // After a failed validation, move focus to the first invalid control in page order. The form is found
  // from the submit event, which React Hook Form passes to its callbacks.
  const focusFirstInvalid = (event?: unknown) => {
    const form = (event as { target?: unknown } | undefined)?.target;
    requestAnimationFrame(() => {
      if (form instanceof HTMLFormElement) {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }
    });
  };

  const onSubmit = handleSubmit(
    async (values, event) => {
      try {
        await mutateAsync(toEnquiryPayload(values));
      } catch (err) {
        // Show the API's field-level messages next to the right fields.
        if (
          err instanceof ApiError &&
          err.code === "VALIDATION_ERROR" &&
          Array.isArray(err.details)
        ) {
          for (const detail of err.details as { path?: string; message?: string }[]) {
            const field = detail.path?.replace(/^body\./, "") as
              keyof EnquiryFormValues | undefined;
            if (field && FIELD_NAMES.has(field) && detail.message)
              setError(field, { message: detail.message });
          }
          focusFirstInvalid(event);
        }
      }
    },
    (_errors, event) => focusFirstInvalid(event),
  );

  if (isSuccess) return <EnquirySuccess />;

  const apiError = error instanceof ApiError ? error : null;
  const formLevelMessage = !error
    ? null
    : apiError?.code === "RATE_LIMITED"
      ? "You've sent several enquiries in a short time. Please try again a little later, or call or WhatsApp us."
      : apiError?.code === "VALIDATION_ERROR"
        ? "Please check the highlighted fields and try again."
        : apiError?.code === "NETWORK_ERROR"
          ? apiError.message
          : "We couldn't send your enquiry just now. Please try again, or call or WhatsApp us.";

  return (
    <form noValidate onSubmit={onSubmit} className="relative space-y-5" aria-label="Enquiry form">
      {formLevelMessage && (
        <Alert variant="danger" title="Your enquiry has not been sent">
          {formLevelMessage}
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Your name" error={errors.fullName?.message} required>
          {(control) => (
            <Input
              autoComplete="name"
              {...control}
              {...register("fullName")}
              invalid={!!errors.fullName}
            />
          )}
        </FormField>
        <FormField
          label="Mobile number"
          error={errors.phone?.message}
          hint="We'll call or message you on this number."
          required
        >
          {(control) => (
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 96661 46913"
              {...control}
              {...register("phone")}
              invalid={!!errors.phone}
            />
          )}
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Preferred plan" error={errors.packageSlug?.message}>
          {(control) => (
            <Select {...control} {...register("packageSlug")}>
              <option value="">Not sure yet</option>
              {packages?.map((pkg) => (
                <option key={pkg.slug} value={pkg.slug}>
                  {pkg.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Preferred branch" error={errors.preferredBranchSlug?.message}>
          {(control) => (
            <Select {...control} {...register("preferredBranchSlug")}>
              <option value="">No preference</option>
              {branches?.map((branch) => (
                <option key={branch.slug} value={branch.slug}>
                  {branch.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Preferred start date" error={errors.preferredDate?.message}>
          {(control) => (
            <Input
              type="date"
              min={todayInBusinessTimezone()}
              {...control}
              {...register("preferredDate")}
              invalid={!!errors.preferredDate}
            />
          )}
        </FormField>
        <FormField label="Preferred time of day" error={errors.preferredTimeWindow?.message}>
          {(control) => (
            <Select {...control} {...register("preferredTimeWindow")}>
              <option value="">Any time</option>
              {TIME_WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <FormField
        label="Pickup address"
        error={errors.pickupAddress?.message}
        hint="Only if you'd like house pickup and drop. Leave blank otherwise."
      >
        {(control) => (
          <Textarea
            rows={3}
            autoComplete="street-address"
            {...control}
            {...register("pickupAddress")}
            invalid={!!errors.pickupAddress}
          />
        )}
      </FormField>

      <FormField label="Message" error={errors.message?.message}>
        {(control) => (
          <Textarea rows={4} {...control} {...register("message")} invalid={!!errors.message} />
        )}
      </FormField>

      {/* Honeypot: invisible to people, tempting to bots. Never remove or label it as required. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
          <input
            type="checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 size-5 shrink-0 rounded border-line-strong accent-brand-800"
            {...register("consent")}
          />
          <span>
            I agree that Sri Sai Balaji Driving School may contact me about my enquiry using the
            details I have provided.
            <span aria-hidden="true" className="ml-0.5 text-accent-600">
              *
            </span>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1.5 text-xs font-medium text-danger-700">
            {errors.consent.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          loading={isSubmitting}
          leadingIcon={<Send aria-hidden="true" className="size-4" />}
        >
          Send enquiry
        </Button>
        <p className="text-sm text-muted">This is an enquiry, not a confirmed booking.</p>
      </div>
    </form>
  );
}
