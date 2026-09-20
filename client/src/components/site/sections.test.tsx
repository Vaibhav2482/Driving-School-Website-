import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockPublicApi, renderWithProviders, TEST_PACKAGE } from "@/test/utils";
import { BranchesSection } from "./BranchesSection";
import { MobileActionBar } from "./MobileActionBar";
import { PackagesSection } from "./PackagesSection";
import { ReviewsGrid } from "./ReviewsSection";
import { RtaServicesList } from "./RtaSection";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PackagesSection (real data only)", () => {
  it("shows a loading state first", () => {
    mockPublicApi({ packages: [TEST_PACKAGE] });
    renderWithProviders(<PackagesSection />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders each plan from the API with its price, lessons, duration, features and booking link", async () => {
    mockPublicApi({ packages: [TEST_PACKAGE] });
    renderWithProviders(<PackagesSection />);

    expect(await screen.findByRole("heading", { name: "Test Plan" })).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("10 lessons")).toBeInTheDocument();
    expect(screen.queryByText(/for 10 lessons/)).not.toBeInTheDocument(); // the count is shown once, not twice
    expect(screen.getByText("45 min each")).toBeInTheDocument();
    expect(screen.getByText("3 months validity")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book this plan" })).toHaveAttribute(
      "href",
      "/book?package=test-plan",
    );
    expect(screen.getByRole("link", { name: /View details of Test Plan/ })).toHaveAttribute(
      "href",
      "/packages/test-plan",
    );
  });

  it("shows 'Price on request' for a ₹0 plan instead of advertising it as free", async () => {
    mockPublicApi({ packages: [{ ...TEST_PACKAGE, pricePaise: 0 }] });
    renderWithProviders(<PackagesSection />);
    expect(await screen.findByText("Price on request")).toBeInTheDocument();
    expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
  });

  it("with no active plans shows the enquiry call to action and never any sample plan", async () => {
    mockPublicApi({ packages: [] });
    renderWithProviders(<PackagesSection />);

    expect(await screen.findByText("Looking for the right training plan?")).toBeInTheDocument();
    expect(screen.getByText("Contact us and we'll help you choose.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "/contact");
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("limits the list on the home page", async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...TEST_PACKAGE,
      slug: `plan-${i}`,
      name: `Plan ${i}`,
    }));
    mockPublicApi({ packages: many });
    renderWithProviders(<PackagesSection limit={3} />);
    await screen.findByRole("heading", { name: "Plan 0" });
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("shows a recoverable error when the API fails, and retries on request", async () => {
    mockPublicApi({ failWith: 500 });
    renderWithProviders(<PackagesSection />);
    expect(await screen.findByText(/couldn't load our training plans/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    mockPublicApi({ packages: [TEST_PACKAGE] });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Test Plan" })).toBeInTheDocument();
  });
});

describe("RTA services (never invented)", () => {
  it("with none published, offers guidance and an enquiry link", async () => {
    mockPublicApi({ rtaServices: [] });
    renderWithProviders(<RtaServicesList />);
    expect(await screen.findByText("Need help with an RTA-related process?")).toBeInTheDocument();
    expect(screen.getByText("Contact our team for guidance.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /enquire now/i })).toHaveAttribute(
      "href",
      "/book?topic=rta",
    );
  });

  it("falls back to the same guidance if the list cannot be loaded", async () => {
    mockPublicApi({ failWith: 500 });
    renderWithProviders(<RtaServicesList />);
    expect(await screen.findByText("Need help with an RTA-related process?")).toBeInTheDocument();
  });

  it("lists the owner's services with documents and fee when they exist", async () => {
    mockPublicApi({
      rtaServices: [
        {
          name: "Test Service",
          slug: "test-service",
          description: "Desc",
          pricePaise: 150000,
          requiredDocuments: ["Doc One"],
        },
      ],
    });
    renderWithProviders(<RtaServicesList />);
    expect(await screen.findByRole("heading", { name: "Test Service" })).toBeInTheDocument();
    expect(screen.getByText("Doc One")).toBeInTheDocument();
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
    expect(screen.queryByText("Need help with an RTA-related process?")).not.toBeInTheDocument();
  });
});

describe("Reviews (never fabricated)", () => {
  it("with no approved reviews shows the invitation, not made-up testimonials", async () => {
    mockPublicApi({ reviews: [] });
    renderWithProviders(<ReviewsGrid />);
    expect(await screen.findByText("Your experience matters.")).toBeInTheDocument();
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });

  it("shows approved reviews with an accessible star rating", async () => {
    mockPublicApi({ reviews: [{ authorName: "A. Learner", rating: 4, body: "Helpful lessons." }] });
    renderWithProviders(<ReviewsGrid />);
    expect(await screen.findByText("Helpful lessons.")).toBeInTheDocument();
    expect(screen.getByText("A. Learner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeInTheDocument();
  });
});

describe("BranchesSection", () => {
  const branches = [
    { name: "Kondapur", slug: "kondapur", address: "Line 1\nLine 2", phone: null, mapUrl: null },
    { name: "Hafeezpet", slug: "hafeezpet", address: null, phone: null, mapUrl: null },
  ];

  it("shows a branch address and directions when known, and no invented address when not", async () => {
    mockPublicApi({ branches });
    renderWithProviders(<BranchesSection />);
    expect(await screen.findByRole("heading", { name: "Kondapur" })).toBeInTheDocument();

    const directions = screen.getByRole("link", { name: /get directions/i });
    expect(directions.getAttribute("href")).toMatch(/google\.com\/maps\/search/);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();

    const hafeezpet = screen
      .getByRole("heading", { name: "Hafeezpet" })
      .closest("article") as HTMLElement;
    expect(hafeezpet).toHaveTextContent("Address coming soon");
    expect(hafeezpet.querySelector("address")).toBeNull();
    expect(screen.getAllByRole("link", { name: /get directions/i })).toHaveLength(1);
  });

  it("uses the owner's map link when provided", async () => {
    mockPublicApi({ branches: [{ ...branches[0]!, mapUrl: "https://maps.example/kondapur" }] });
    renderWithProviders(<BranchesSection />);
    expect(await screen.findByRole("link", { name: /get directions/i })).toHaveAttribute(
      "href",
      "https://maps.example/kondapur",
    );
  });

  it("still names both confirmed branches (and the confirmed Kondapur address) when the API is down", async () => {
    mockPublicApi({ failWith: 500 });
    renderWithProviders(<BranchesSection />);
    expect(await screen.findByRole("heading", { name: "Kondapur" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hafeezpet" })).toBeInTheDocument();
    expect(screen.getByText(/Kondapur Road, Khanamet/)).toBeInTheDocument();
  });
});

describe("MobileActionBar", () => {
  it("offers Call, WhatsApp and Book with correct links", async () => {
    mockPublicApi();
    renderWithProviders(<MobileActionBar />);
    expect(screen.getByRole("link", { name: /call/i })).toHaveAttribute(
      "href",
      "tel:+919666146913",
    );
    const wa = screen.getByRole("link", { name: /whatsapp/i });
    expect(wa.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/919666146913\?text=/);
    expect(wa).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute("href", "/book");
  });

  it("is hidden on the enquiry page, where it would cover the submit button", async () => {
    mockPublicApi();
    const { container } = renderWithProviders(<MobileActionBar />, { route: "/book" });
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
