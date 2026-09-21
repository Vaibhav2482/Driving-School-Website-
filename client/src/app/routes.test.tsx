import { render, screen, waitFor } from "@testing-library/react";
// NOTE: import RouterProvider from "react-router" here, not "react-router/dom" (which App.tsx uses).
// Under Vitest the two entry points resolve to different builds (CJS vs ESM), which would create two
// router contexts. The app itself is unaffected because Vite resolves a single ESM copy.
import { RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { setContentForTests } from "@/features/public/content";
import { TEST_PACKAGE } from "@/test/utils";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("the single-page site", () => {
  it("renders the home page inside the site layout with one h1", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", { level: 1, name: /Learn to drive/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("has a section for every menu target", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
    for (const id of ["home", "about", "plans", "rta", "faq", "contact"]) {
      expect(document.getElementById(id), `#${id}`).not.toBeNull();
    }
  });

  it.each([
    ["/about", "about"],
    ["/courses", "training"],
    ["/packages", "plans"],
    ["/packages/test-plan", "plans"],
    ["/rta-services", "rta"],
    ["/contact", "contact"],
    ["/book", "contact"],
    ["/faq", "faq"],
    ["/reviews", "about"],
  ])("sends the old URL %s to the #%s section of the home page", async (path, section) => {
    const router = renderAt(path);
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(router.state.location.hash).toBe(`#${section}`);
  });

  it("shows a 404 inside the site layout for unknown URLs", async () => {
    renderAt("/definitely/not/a/page");
    expect(
      await screen.findByRole("heading", { name: /couldn't find that page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("has a skip link and marks the main landmark", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});

describe("home page content rules", () => {
  it("shows plans that exist, and hides the reviews section when there are no reviews", async () => {
    setContentForTests({ packages: [TEST_PACKAGE] });
    renderAt("/");
    expect(await screen.findByRole("heading", { name: "Test Plan" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What our learners say" }),
    ).not.toBeInTheDocument();
  });

  it("shows the reviews section when reviews exist", async () => {
    setContentForTests({ reviews: [{ authorName: "A. Learner", rating: 5, body: "Great." }] });
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "What our learners say" }),
    ).toBeInTheDocument();
  });

  it("with no plans shows the enquiry prompt and no invented price anywhere", async () => {
    renderAt("/");
    expect(await screen.findByText("Looking for the right training plan?")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/₹/);
  });

  it("has confirmed contact actions", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
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
