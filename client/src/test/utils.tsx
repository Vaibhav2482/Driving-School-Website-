import { render } from "@testing-library/react";
import type { ReactElement } from "react";
// NOTE: MemoryRouter comes from "react-router" (not "react-router/dom") to match the components under test.
import { MemoryRouter } from "react-router";
import type { PublicPackage } from "@/features/public/types";

/** Render inside an in-memory router. */
export function renderWithRouter(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

/** Layout-test data. Clearly fake; used only inside tests. */
export const TEST_PACKAGE: PublicPackage = {
  name: "Test Plan",
  slug: "test-plan",
  description: "A plan for tests.",
  pricePaise: 500000,
  lessonCount: 10,
  lessonDurationMinutes: 45,
  vehicleType: "CAR",
  validityDays: 90,
  features: ["Feature A", "Feature B"],
};
