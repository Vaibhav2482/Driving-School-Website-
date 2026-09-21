import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown, MessageCircle, Phone, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBranches, useBusinessInfo, usePackages } from "@/features/public/hooks";
import { formatPhone, telHref } from "@/lib/contact";
import { todayInBusinessTimezone } from "@/lib/time";
import { enquiryWhatsappHref } from "./message";
import {
  enquiryFormSchema,
  TIME_WINDOW_OPTIONS,
  toEnquiryDetails,
  type EnquiryFormValues,
} from "./schema";

const EMPTY_VALUES: EnquiryFormValues = {
  fullName: "",
  phone: "",
  packageSlug: "",
  preferredBranchSlug: "",
  preferredDate: "",
  preferredTimeWindow: "",
  pickupAddress: "",
  message: "",
};

/** After a failed validation, move focus to the first invalid control in page order. */
function focusFirstInvalid(event?: unknown) {
  const form = (event as { target?: unknown } | undefined)?.target;
  requestAnimationFrame(() => {
    if (form instanceof HTMLFormElement) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  });
}

function ReadyToSend({ href, onEdit }: { href: string; onEdit: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const phone = getPrimaryPhone(useBusinessInfo());

  // Move focus to the confirmation so screen-reader users hear it.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div role="status" className="py-4 text-center sm:py-8">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-100 text-accent-800">
        <MessageCircle aria-hidden="true" className="size-8" />
      </span>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-2xl font-semibold text-ink outline-none sm:text-3xl"
      >
        Your enquiry is ready
      </h3>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Tap the button to open WhatsApp with your details filled in, then press send. We&apos;ll
        reply and arrange your lesson.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({ variant: "accent", size: "lg" })}
        >
          <MessageCircle aria-hidden="true" className="size-5" />
          Send on WhatsApp
        </a>
        {phone && (
          <a href={telHref(phone)} className={buttonStyles({ variant: "secondary", size: "lg" })}>
            <Phone aria-hidden="true" className="size-4" />
            Call {formatPhone(phone)}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Change my details
      </button>
    </div>
  );
}

/**
 * The enquiry form. There is no server: on submit the details become a ready-to-send WhatsApp message to the
 * school, and the visitor taps "Send" in WhatsApp. This is an ENQUIRY, not a confirmed booking.
 */
export function EnquiryForm() {
  const { data: packages } = usePackages();
  const { data: branches } = useBranches();
  const whatsapp = getWhatsappNumber(useBusinessInfo());
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: EMPTY_VALUES,
    // We focus the first invalid field ourselves (in visual order).
    shouldFocusError: false,
  });

  const optionalHasError = Boolean(
    errors.packageSlug ||
    errors.preferredBranchSlug ||
    errors.preferredDate ||
    errors.preferredTimeWindow ||
    errors.pickupAddress ||
    errors.message,
  );

  const onSubmit = handleSubmit(
    (values) => {
      if (!whatsapp) return;
      setWhatsappUrl(
        enquiryWhatsappHref(whatsapp, toEnquiryDetails(values), { packages, branches }),
      );
    },
    (_errors, event) => focusFirstInvalid(event),
  );

  return (
    <>
      {whatsappUrl && <ReadyToSend href={whatsappUrl} onEdit={() => setWhatsappUrl(null)} />}
      <form
        noValidate
        onSubmit={onSubmit}
        hidden={whatsappUrl !== null}
        className="space-y-5"
        aria-label="Enquiry form"
      >
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
            hint="We'll reply on this number."
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

        {/* The optional extras stay tucked away so the form starts short. They open by themselves if one has an error. */}
        <details
          className="group border-t border-line pt-5"
          open={optionalHasError ? true : undefined}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-control font-display text-xl font-bold text-brand-950 uppercase italic [&::-webkit-details-marker]:hidden">
            <span>
              Add more details{" "}
              <span className="font-sans text-sm font-medium tracking-normal text-muted normal-case not-italic">
                (optional)
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-accent-600 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {packages.length > 0 && (
                <FormField label="Preferred plan" error={errors.packageSlug?.message}>
                  {(control) => (
                    <Select {...control} {...register("packageSlug")}>
                      <option value="">Not sure yet</option>
                      {packages.map((pkg) => (
                        <option key={pkg.slug} value={pkg.slug}>
                          {pkg.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              )}
              <FormField label="Preferred branch" error={errors.preferredBranchSlug?.message}>
                {(control) => (
                  <Select {...control} {...register("preferredBranchSlug")}>
                    <option value="">No preference</option>
                    {branches.map((branch) => (
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
                <Textarea
                  rows={3}
                  {...control}
                  {...register("message")}
                  invalid={!!errors.message}
                />
              )}
            </FormField>
          </div>
        </details>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            leadingIcon={<Send aria-hidden="true" className="size-4" />}
          >
            Continue on WhatsApp
          </Button>
          <p className="text-sm text-muted">This is an enquiry, not a confirmed booking.</p>
        </div>
      </form>
    </>
  );
}
