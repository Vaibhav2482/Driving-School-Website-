import { describe, expect, it } from "vitest";
import { normalizeIndianMobile, normalizeText } from "./text.js";
import { addDaysIso, isValidIsoDate, todayInTimeZone } from "./time.js";

describe("normalizeText", () => {
  it("collapses whitespace, strips tags and control characters", () => {
    expect(normalizeText("  <i>Hello</i>\t  wor\u0007ld \n ")).toBe("Hello world");
  });

  it("keeps paragraph breaks in multiline mode but limits blank lines", () => {
    expect(normalizeText("a  \r\n\r\n\r\n\r\n b", { multiline: true })).toBe("a\n\nb");
  });

  it("normalises Unicode to NFC", () => {
    expect(normalizeText("é")).toBe("é");
  });

  it("keeps Telugu and other scripts intact", () => {
    expect(normalizeText("  శ్రీ సాయి  ")).toBe("శ్రీ సాయి");
  });
});

describe("normalizeIndianMobile", () => {
  it.each([
    ["9666146913", "+919666146913"],
    ["+91 96661 46913", "+919666146913"],
    ["09000574542", "+919000574542"],
    ["919676617132", "+919676617132"],
  ])("%j → %j", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(["", "12345", "5666146913", "+14155550100", "96661469", "abcdefghij"])(
    "rejects %j",
    (input) => {
      expect(normalizeIndianMobile(input)).toBe("");
    },
  );
});

describe("date helpers", () => {
  it("computes 'today' in the business time zone, not UTC", () => {
    // 20:00 UTC on the 20th is already the 21st in India (UTC+5:30).
    expect(todayInTimeZone("Asia/Kolkata", new Date("2026-09-20T20:00:00Z"))).toBe("2026-09-21");
    expect(todayInTimeZone("UTC", new Date("2026-09-20T20:00:00Z"))).toBe("2026-09-20");
  });

  it("validates real calendar dates only", () => {
    expect(isValidIsoDate("2026-09-20")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-9-2")).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDaysIso("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysIso("2026-01-01", -1)).toBe("2025-12-31");
  });
});
