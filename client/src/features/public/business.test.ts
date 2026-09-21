import { describe, expect, it } from "vitest";
import { BUSINESS_DEFAULTS } from "@/config/business-defaults";
import { getPrimaryPhone, getWhatsappNumber } from "./business";

describe("business defaults", () => {
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
