import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
// NOTE: MemoryRouter comes from "react-router" (not "react-router/dom") to match the components under test.
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import type {
  PublicBranch,
  PublicPackage,
  PublicReview,
  PublicRtaService,
  PublicSettings,
} from "@/features/public/types";

/** Render with the app's providers and an in-memory router. Retries are off so failures show at once. */
export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export interface MockApiData {
  packages?: PublicPackage[];
  branches?: PublicBranch[];
  settings?: PublicSettings;
  rtaServices?: PublicRtaService[];
  reviews?: PublicReview[];
  /** Make every request fail with this HTTP status (simulates the API being down). */
  failWith?: number;
  /** Response for POST /public/enquiries. */
  enquiry?: () => Response;
}

/** Stub `fetch` with an in-memory public API. Returns the mock so tests can inspect calls. */
export function mockPublicApi(data: MockApiData = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace("/api/v1/public", "");
    const method = init?.method ?? "GET";

    if (data.failWith) {
      return Promise.resolve(
        json({ error: { code: "INTERNAL_ERROR", message: "Down." } }, data.failWith),
      );
    }
    if (method === "POST" && path === "/enquiries") {
      return Promise.resolve(
        data.enquiry ? data.enquiry() : json({ data: { received: true } }, 201),
      );
    }
    if (path === "/packages") return Promise.resolve(json({ data: data.packages ?? [] }));
    if (path.startsWith("/packages/")) {
      const pkg = data.packages?.find((p) => p.slug === path.split("/")[2]);
      return Promise.resolve(
        pkg
          ? json({ data: pkg })
          : json({ error: { code: "NOT_FOUND", message: "Not found." } }, 404),
      );
    }
    if (path === "/branches") return Promise.resolve(json({ data: data.branches ?? [] }));
    if (path === "/settings") return Promise.resolve(json({ data: data.settings ?? {} }));
    if (path === "/rta-services") return Promise.resolve(json({ data: data.rtaServices ?? [] }));
    if (path === "/reviews") return Promise.resolve(json({ data: data.reviews ?? [] }));
    return Promise.resolve(json({ error: { code: "NOT_FOUND", message: "Not found." } }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
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

export const enquiryCalls = (fetchMock: ReturnType<typeof mockPublicApi>) =>
  fetchMock.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)) as Record<string, unknown>);
