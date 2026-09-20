import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Input";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("associates the label with the control", () => {
    render(<FormField label="Mobile number">{(control) => <Input {...control} />}</FormField>);
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument();
  });

  it("links hint and error to the control and marks it invalid", () => {
    render(
      <FormField label="Mobile number" hint="10 digits" error="Enter a valid number." required>
        {(control) => <Input {...control} invalid />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Mobile number/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("10 digits Enter a valid number.");
  });

  it("has no aria-invalid or description when there is nothing to report", () => {
    render(<FormField label="Name">{(control) => <Input {...control} />}</FormField>);
    const input = screen.getByLabelText("Name");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
});
