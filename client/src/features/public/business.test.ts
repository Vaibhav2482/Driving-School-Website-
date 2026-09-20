import { describe, expect, it } from "vitest";
import { BUSINESS_DEFAULTS } from "@/config/business-defaults";
import { getPrimaryPhone, getWhatsappNumber, parseBusinessInfo } from "./business";

describe("parseBusinessInfo", () => {
  it("falls back to the card-printed facts while settings are loading or unavailable", () => {
    expect(parseBusinessInfo(undefined)).toEqual(BUSINESS_DEFAULTS);
    expect(parseBusinessInfo({})).toEqual(BUSINESS_DEFAULTS);
  });

  it("the confirmed defaults contain exactly the confirmed facts and nothing invented", () => {
    expect(BUSINESS_DEFAULTS.phones.map((p) => p.number)).toEqual([
      "+919666146913",
      "+919000574542",
      "+919676617132",
    ]);
    expect(BUSINESS_DEFAULTS.phones.filter((p) => p.whatsapp).map((p) => p.number)).toEqual([
      "+919666146913",
    ]);
    expect(BUSINESS_DEFAULTS.proprietor).toBe("P. Mahesh");
    expect(BUSINESS_DEFAULTS.email).toBeNull();
    expect(BUSINESS_DEFAULTS.workingHours).toBeNull();
    expect(BUSINESS_DEFAULTS.addressLines.join(" ")).toContain("Kondapur Road");
  });

  it("owner-managed values from the API override the defaults", () => {
    const info = parseBusinessInfo({
      "business.phones": [{ number: "+919999999999", whatsapp: true }],
      "business.email": "hello@example.org",
      "business.workingHours": "Mon-Sat 6am-6pm",
      "business.address": { lines: ["Line 1", "Line 2"] },
    });
    expect(info.phones).toEqual([{ number: "+919999999999", whatsapp: true }]);
    expect(info.email).toBe("hello@example.org");
    expect(info.workingHours).toBe("Mon-Sat 6am-6pm");
    expect(info.addressLines).toEqual(["Line 1", "Line 2"]);
  });

  it("respects an explicit null: a removed recognition line is hidden, not silently restored", () => {
    expect(parseBusinessInfo({ "business.recognition": null }).recognition).toBeNull();
    expect(parseBusinessInfo({ "business.recognition": "   " }).recognition).toBeNull();
  });

  it("ignores malformed values and keeps the safe default", () => {
    const info = parseBusinessInfo({
      "business.phones": [{ number: "not-a-number" }],
      "business.address": "just a string",
      "business.confirmedServices": [1, 2],
      "business.name": 42,
    });
    expect(info.phones).toEqual(BUSINESS_DEFAULTS.phones);
    expect(info.addressLines).toEqual(BUSINESS_DEFAULTS.addressLines);
    expect(info.confirmedServices).toEqual(BUSINESS_DEFAULTS.confirmedServices);
    expect(info.name).toBe(BUSINESS_DEFAULTS.name);
  });
});

describe("phone selection", () => {
  it("uses the number flagged WhatsApp for click-to-chat, else the first number", () => {
    expect(getWhatsappNumber(BUSINESS_DEFAULTS)).toBe("+919666146913");
    expect(
      getWhatsappNumber({
        ...BUSINESS_DEFAULTS,
        phones: [
          { number: "+911111111111", whatsapp: false },
          { number: "+912222222222", whatsapp: true },
        ],
      }),
    ).toBe("+912222222222");
    expect(
      getWhatsappNumber({
        ...BUSINESS_DEFAULTS,
        phones: [{ number: "+913333333333", whatsapp: false }],
      }),
    ).toBe("+913333333333");
    expect(getWhatsappNumber({ ...BUSINESS_DEFAULTS, phones: [] })).toBeNull();
  });

  it("uses the first number for the Call action", () => {
    expect(getPrimaryPhone(BUSINESS_DEFAULTS)).toBe("+919666146913");
  });
});
