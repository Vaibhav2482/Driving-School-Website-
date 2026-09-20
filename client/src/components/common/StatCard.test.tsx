import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("never invents a number: missing data renders a dash", () => {
    render(<StatCard label="Active students" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows real values, including zero", () => {
    render(<StatCard label="Today's bookings" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows a loading skeleton and hides the value while loading", () => {
    const { container } = render(<StatCard label="Revenue" value="₹1" isLoading />);
    expect(screen.queryByText("₹1")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
  });
});
