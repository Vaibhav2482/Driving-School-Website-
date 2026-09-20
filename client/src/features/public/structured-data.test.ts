import { describe, expect, it } from "vitest";
import { BUSINESS_DEFAULTS } from "@/config/business-defaults";
import { buildDrivingSchoolJsonLd } from "./structured-data";

describe("DrivingSchool structured data", () => {
  const data = buildDrivingSchoolJsonLd(BUSINESS_DEFAULTS, {
    branchNames: ["Kondapur", "Hafeezpet"],
  });

  it("describes the school from real data", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("DrivingSchool");
    expect(data.name).toBe("Sri Sai Balaji Driving School");
    expect(data.telephone).toBe("+919666146913");
    expect(data.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress:
        "H.No. 2-40/8/45, Kondapur Road, Khanamet, Near Aditya Sunshine, Hanuman Nagar",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    });
    expect(data.areaServed).toEqual([
      { "@type": "Place", name: "Kondapur, Hyderabad" },
      { "@type": "Place", name: "Hafeezpet, Hyderabad" },
    ]);
  });

  it("never includes data the client has not provided (no ratings, hours, price range, geo, email)", () => {
    for (const forbidden of [
      "aggregateRating",
      "review",
      "openingHours",
      "openingHoursSpecification",
      "priceRange",
      "geo",
      "email",
    ]) {
      expect(data).not.toHaveProperty(forbidden);
    }
  });

  it("includes email and url only once they exist", () => {
    const withData = buildDrivingSchoolJsonLd(
      { ...BUSINESS_DEFAULTS, email: "hello@example.org" },
      { siteUrl: "https://www.example.org" },
    );
    expect(withData.email).toBe("hello@example.org");
    expect(withData.url).toBe("https://www.example.org");
    expect(data).not.toHaveProperty("url");
  });
});
