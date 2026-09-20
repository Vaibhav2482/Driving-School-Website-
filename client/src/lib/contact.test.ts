import { describe, expect, it } from "vitest";
import { directionsHref, formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "./contact";

describe("contact helpers", () => {
  it("builds tel: links", () => {
    expect(telHref("+919666146913")).toBe("tel:+919666146913");
    expect(telHref("96661 46913")).toBe("tel:+9666146913");
  });

  it("builds wa.me click-to-chat links with the country code and a URL-encoded prefilled message", () => {
    expect(whatsappHref("+919666146913")).toBe("https://wa.me/919666146913");
    expect(whatsappHref("+919666146913", WHATSAPP_MESSAGES.general)).toBe(
      "https://wa.me/919666146913?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20driving%20lessons%20at%20Sri%20Sai%20Balaji%20Driving%20School.",
    );
  });

  it("uses the requested prefilled message for the general enquiry", () => {
    expect(WHATSAPP_MESSAGES.general).toBe(
      "Hi, I would like to enquire about driving lessons at Sri Sai Balaji Driving School.",
    );
  });

  it("formats Indian mobiles the way they are written on the business card", () => {
    expect(formatPhone("+919666146913")).toBe("9666 146 913");
    expect(formatPhone("+919000574542")).toBe("9000 574 542");
    expect(formatPhone("+919676617132")).toBe("9676 617 132");
    expect(formatPhone("12345")).toBe("12345"); // unknown shapes are left alone
  });

  it("prefers the owner's map link, otherwise searches for the address, otherwise offers nothing", () => {
    expect(directionsHref({ mapUrl: "https://maps.example/x", address: "A" })).toBe(
      "https://maps.example/x",
    );
    const generated = directionsHref({ address: "H.No. 2-40/8/45\nKondapur Road" });
    expect(generated).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    expect(decodeURIComponent(generated ?? "")).toContain("H.No. 2-40/8/45, Kondapur Road");
    expect(directionsHref({ address: null, mapUrl: null })).toBeNull();
  });
});
