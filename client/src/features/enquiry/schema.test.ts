import { describe, expect, it } from "vitest";
import { addDays, format } from "date-fns";
import {
  enquiryFormSchema,
  isValidIndianMobile,
  toEnquiryPayload,
  type EnquiryFormValues,
} from "./schema";

const base: EnquiryFormValues = {
  fullName: "Asha Reddy",
  phone: "96661 46913",
  packageSlug: "",
  preferredBranchSlug: "",
  preferredDate: "",
  preferredTimeWindow: "",
  pickupAddress: "",
  message: "",
  consent: true,
  website: "",
};

const issues = (values: Partial<EnquiryFormValues>) => {
  const result = enquiryFormSchema.safeParse({ ...base, ...values });
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("enquiry form validation", () => {
  it("accepts a minimal valid enquiry (name, phone, consent)", () => {
    expect(issues({})).toEqual([]);
  });

  it("requires a name, a valid phone and consent", () => {
    expect(issues({ fullName: "", phone: "", consent: false }).sort()).toEqual([
      "consent: Please tick the box to let us contact you.",
      "fullName: Please enter your name.",
      "phone: Please enter your mobile number.",
    ]);
  });

  it.each(["9666146913", "+91 96661 46913", "096661 46913", "(96661) 46913"])(
    "accepts the phone format %j",
    (phone) => {
      expect(isValidIndianMobile(phone)).toBe(true);
    },
  );

  it.each(["12345", "5666146913", "abc", "+14155550100"])("rejects the phone %j", (phone) => {
    expect(isValidIndianMobile(phone)).toBe(false);
  });

  it("rejects a date in the past but accepts a future one", () => {
    expect(issues({ preferredDate: "2020-01-01" })[0]).toMatch(/preferredDate/);
    expect(issues({ preferredDate: format(addDays(new Date(), 3), "yyyy-MM-dd") })).toEqual([]);
  });

  it("limits message and address length", () => {
    expect(issues({ message: "x".repeat(1001) })[0]).toMatch(/message/);
    expect(issues({ pickupAddress: "x".repeat(301) })[0]).toMatch(/pickupAddress/);
  });
});

describe("toEnquiryPayload", () => {
  it("leaves out everything the visitor did not fill in", () => {
    expect(toEnquiryPayload(base)).toEqual({
      fullName: "Asha Reddy",
      phone: "96661 46913",
      consent: true,
      website: "",
    });
  });

  it("includes optional fields when they are filled in and trims whitespace", () => {
    expect(
      toEnquiryPayload({
        ...base,
        fullName: "  Asha Reddy ",
        packageSlug: "test-plan",
        preferredBranchSlug: "kondapur",
        preferredTimeWindow: "EVENING",
        pickupAddress: " Flat 4 ",
        message: "Hello",
      }),
    ).toMatchObject({
      fullName: "Asha Reddy",
      packageSlug: "test-plan",
      preferredBranchSlug: "kondapur",
      preferredTimeWindow: "EVENING",
      pickupAddress: "Flat 4",
      message: "Hello",
    });
  });
});
