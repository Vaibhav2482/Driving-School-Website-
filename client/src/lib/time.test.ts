import { describe, expect, it } from "vitest";
import { formatBusinessDateTime, formatCalendarDate } from "./time";

describe("formatBusinessDateTime", () => {
  it("shows an instant in India time (UTC+5:30), not the device time zone", () => {
    // 04:30 UTC is 10:00 in Hyderabad.
    const text = formatBusinessDateTime("2026-09-20T04:30:00Z");
    expect(text).toContain("10:00");
    expect(text).toContain("2026");
  });

  it("rolls over to the next calendar day when UTC is late evening", () => {
    // 20:00 UTC on the 20th is 01:30 on the 21st in India.
    const text = formatBusinessDateTime("2026-09-20T20:00:00Z");
    expect(text).toContain("21");
    expect(text).toContain("1:30");
  });

  it("returns an empty string for invalid input instead of throwing", () => {
    expect(formatBusinessDateTime("not-a-date")).toBe("");
  });
});

describe("formatCalendarDate", () => {
  it("formats a date-only value without shifting the day", () => {
    expect(formatCalendarDate("2026-09-20")).toBe("20 Sep 2026");
    expect(formatCalendarDate("2026-01-01")).toBe("1 Jan 2026");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatCalendarDate("nope")).toBe("");
  });
});
