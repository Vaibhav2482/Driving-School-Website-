import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/common/FormField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  option: z.string().min(1, "Please choose an option."),
  notes: z.string().max(300, "Please keep this under 300 characters.").optional(),
});

type FormValues = z.infer<typeof schema>;

/** Demonstrates the form stack (React Hook Form + Zod + FormField). Nothing is sent anywhere. */
export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { option: "" } });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        setSubmitted(true);
      })}
    >
      {submitted && (
        <Alert variant="success" title="Valid">
          Demo only: nothing was sent to the server.
        </Alert>
      )}
      <FormField label="Full name" error={errors.fullName?.message} required>
        {(control) => <Input autoComplete="name" {...control} {...register("fullName")} />}
      </FormField>
      <FormField
        label="Mobile number"
        hint="10 digits, without +91."
        error={errors.phone?.message}
        required
      >
        {(control) => (
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            {...control}
            {...register("phone")}
          />
        )}
      </FormField>
      <FormField label="Select" error={errors.option?.message} required>
        {(control) => (
          <Select {...control} {...register("option")}>
            <option value="">Choose…</option>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </Select>
        )}
      </FormField>
      <FormField label="Notes" error={errors.notes?.message}>
        {(control) => <Textarea {...control} {...register("notes")} />}
      </FormField>
      <Button type="submit" variant="accent" loading={isSubmitting}>
        Validate
      </Button>
    </form>
  );
}
