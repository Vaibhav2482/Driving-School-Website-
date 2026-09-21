import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setContentForTests } from "@/features/public/content";
import { renderWithRouter, TEST_PACKAGE } from "@/test/utils";
import { BranchesSection } from "./BranchesSection";
import { MobileActionBar } from "./MobileActionBar";
import { PackagesSection } from "./PackagesSection";
import { ReviewsGrid } from "./ReviewsSection";
import { RtaServicesList } from "./RtaSection";

describe("PackagesSection (only real plans)", () => {
  it("shows a plan with every stated fact and a link to the enquiry section", () => {
    setContentForTests({ packages: [TEST_PACKAGE] });
    renderWithRouter(<PackagesSection />);
    expect(screen.getByRole("heading", { name: "Test Plan" })).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("10 lessons")).toBeInTheDocument();
    expect(screen.queryByText(/for 10 lessons/)).not.toBeInTheDocument(); // the count is shown once
    expect(screen.getByText("45 min each")).toBeInTheDocument();
    expect(screen.getByText("3 months validity")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enquire about this plan" })).toHaveAttribute(
      "href",
      "/#contact",
    );
  });

  it("shows 'Price on request' rather than a made-up or zero price", () => {
    setContentForTests({ packages: [{ ...TEST_PACKAGE, pricePaise: 0 }] });
    renderWithRouter(<PackagesSection />);
    expect(screen.getByText("Price on request")).toBeInTheDocument();
    expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
  });

  it("with no plans published shows a 'contact us' prompt and no sample plans or prices", () => {
    renderWithRouter(<PackagesSection />);
    expect(screen.getByText("Looking for the right training plan?")).toBeInTheDocument();
    expect(screen.getByText("Contact us and we'll help you choose.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute(
      "href",
      "/#contact",
    );
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("can limit how many plans are shown", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...TEST_PACKAGE,
      slug: `plan-${i}`,
      name: `Plan ${i}`,
    }));
    setContentForTests({ packages: many });
    renderWithRouter(<PackagesSection limit={2} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("RTA services (never invented)", () => {
  it("with none published, offers guidance and an enquiry link", () => {
    renderWithRouter(<RtaServicesList />);
    expect(screen.getByText("Need help with an RTA-related process?")).toBeInTheDocument();
    expect(screen.getByText("Contact our team for guidance.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /enquire now/i })).toHaveAttribute("href", "/#contact");
  });

  it("lists the services with documents and fee when they are provided", () => {
    setContentForTests({
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
    renderWithRouter(<RtaServicesList />);
    expect(screen.getByRole("heading", { name: "Test Service" })).toBeInTheDocument();
    expect(screen.getByText("Doc One")).toBeInTheDocument();
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
    expect(screen.queryByText("Need help with an RTA-related process?")).not.toBeInTheDocument();
  });
});

describe("Reviews (never fabricated)", () => {
  it("renders nothing when there are no reviews", () => {
    const { container } = renderWithRouter(<ReviewsGrid />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows reviews with an accessible star rating", () => {
    setContentForTests({
      reviews: [{ authorName: "A. Learner", rating: 4, body: "Helpful lessons." }],
    });
    renderWithRouter(<ReviewsGrid />);
    expect(screen.getByText("Helpful lessons.")).toBeInTheDocument();
    expect(screen.getByText("A. Learner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeInTheDocument();
  });
});

describe("BranchesSection", () => {
  it("shows the confirmed Kondapur address with directions, and no invented Hafeezpet address", () => {
    renderWithRouter(<BranchesSection />);
    expect(screen.getByRole("heading", { name: "Kondapur" })).toBeInTheDocument();
    expect(screen.getByText(/Kondapur Road, Khanamet/)).toBeInTheDocument();

    const directions = screen.getByRole("link", { name: /get directions/i });
    expect(directions.getAttribute("href")).toMatch(/google\.com\/maps\/search/);

    const hafeezpet = screen
      .getByRole("heading", { name: "Hafeezpet" })
      .closest("article") as HTMLElement;
    expect(hafeezpet).toHaveTextContent("call us for this branch");
    expect(hafeezpet.querySelector("address")).toBeNull();
    expect(screen.getAllByRole("link", { name: /get directions/i })).toHaveLength(1);
  });

  it("uses a provided map link", () => {
    setContentForTests({
      branches: [
        {
          name: "Kondapur",
          slug: "kondapur",
          address: "Line 1",
          phone: null,
          mapUrl: "https://maps.example/kondapur",
        },
      ],
    });
    renderWithRouter(<BranchesSection />);
    expect(screen.getByRole("link", { name: /get directions/i })).toHaveAttribute(
      "href",
      "https://maps.example/kondapur",
    );
  });
});

describe("MobileActionBar", () => {
  it("puts Call, WhatsApp and Book one tap away", () => {
    renderWithRouter(<MobileActionBar />);
    expect(screen.getByRole("link", { name: /call/i })).toHaveAttribute(
      "href",
      "tel:+919666146913",
    );
    expect(screen.getByRole("link", { name: /whatsapp/i }).getAttribute("href")).toMatch(
      /^https:\/\/wa\.me\/919666146913/,
    );
    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute("href", "/#contact");
  });
});
