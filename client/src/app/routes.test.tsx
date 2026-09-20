import { render, screen } from "@testing-library/react";
// NOTE: import RouterProvider from "react-router" here, not "react-router/dom" (which App.tsx uses).
// Under Vitest the two entry points resolve to different builds (CJS vs ESM), which would create two
// router contexts. The app itself is unaffected because Vite resolves a single ESM copy.
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPublicApi, TEST_PACKAGE } from "@/test/utils";
import { AppProviders } from "./providers";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

beforeEach(() => {
  mockPublicApi({ packages: [TEST_PACKAGE] });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public routes", () => {
  it.each([
    ["/", /Learn to drive/],
    ["/about", "About Sri Sai Balaji Driving School"],
    ["/courses", "Practical driving training, built around you"],
    ["/packages", "Choose your training plan"],
    ["/rta-services", "We guide you in all RTA works"],
    ["/contact", "Talk to Sri Sai Balaji Driving School"],
    ["/book", "Book your driving lesson"],
    ["/faq", "Frequently asked questions"],
    ["/reviews", "What our learners say"],
  ])("renders %s inside the public layout with one h1", async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders a package detail page from the API", async () => {
    renderAt("/packages/test-plan");
    expect(await screen.findByRole("heading", { level: 1, name: "Test Plan" })).toBeInTheDocument();
    expect(await screen.findByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book this plan" })).toHaveAttribute(
      "href",
      "/book?package=test-plan",
    );
  });

  it("never leaves a package page empty when the owner has not added a description or features yet", async () => {
    mockPublicApi({ packages: [{ ...TEST_PACKAGE, description: null, features: [] }] });
    renderAt("/packages/test-plan");
    expect(await screen.findByRole("heading", { name: "Want to know more?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "About this plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /What's included/ })).not.toBeInTheDocument();
  });

  it("shows a polished 404 for a package that does not exist (or is not active)", async () => {
    renderAt("/packages/no-such-plan");
    expect(
      await screen.findByRole("heading", { name: /couldn't find that package/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all packages" })).toHaveAttribute(
      "href",
      "/packages",
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument(); // still inside the site layout
  });

  it("shows a 404 inside the site layout for unknown URLs", async () => {
    renderAt("/definitely/not/a/page");
    expect(
      await screen.findByRole("heading", { name: /couldn't find that page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("has a skip link and marks the main landmark", async () => {
    renderAt("/contact");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});

describe("home page content rules", () => {
  it("shows live plans, and hides the reviews section entirely when there are no approved reviews", async () => {
    renderAt("/");
    expect(await screen.findByRole("heading", { name: "Test Plan" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What our learners say" }),
    ).not.toBeInTheDocument();
  });

  it("shows the reviews section when approved reviews exist", async () => {
    mockPublicApi({
      packages: [TEST_PACKAGE],
      reviews: [{ authorName: "A. Learner", rating: 5, body: "Great." }],
    });
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "What our learners say" }),
    ).toBeInTheDocument();
  });

  it("with no plans shows the enquiry call to action and no invented price anywhere", async () => {
    mockPublicApi({ packages: [] });
    renderAt("/");
    expect(await screen.findByText("Looking for the right training plan?")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/₹/);
  });

  it("has a single primary call to action and confirmed contact actions", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("link", { name: /book your lesson/i }).length).toBeGreaterThan(0);
    expect(document.querySelector('a[href="tel:+919666146913"]')).not.toBeNull();
    expect(document.querySelector('a[href^="https://wa.me/919666146913"]')).not.toBeNull();
  });

  it("makes no unsupported superlative claims", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
    expect(document.body.textContent).not.toMatch(
      /best driving school|number\s*1|no\.\s*1|100%|pass rate|years of experience|thousands/i,
    );
  });
});

describe("role-guarded routes", () => {
  it.each(["/admin", "/student", "/instructor"])(
    "redirects an anonymous visitor from %s to the sign-in page",
    async (path) => {
      const router = renderAt(path);
      expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/auth/login");
    },
  );

  it("lets the Phase 1 development bypass reach the admin placeholder (dev builds only)", async () => {
    vi.stubEnv("VITE_DEV_BYPASS_AUTH_GUARDS", "true");
    renderAt("/admin");
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
  });

  it("marks not-yet-built navigation items as disabled rather than linking to nothing", async () => {
    vi.stubEnv("VITE_DEV_BYPASS_AUTH_GUARDS", "true");
    renderAt("/admin");
    await screen.findByRole("heading", { level: 1, name: "Dashboard" });
    expect(screen.queryByRole("link", { name: /Students/ })).not.toBeInTheDocument();
    expect(screen.getByText("Students").closest("[aria-disabled='true']")).not.toBeNull();
  });
});
