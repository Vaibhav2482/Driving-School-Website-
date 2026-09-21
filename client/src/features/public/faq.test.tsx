import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { BUSINESS_DEFAULTS } from "@/config/business-defaults";
import { buildFaq } from "./faq";

const text = (node: React.ReactNode) => {
  const { container } = render(<MemoryRouter>{node}</MemoryRouter>);
  return container.textContent ?? "";
};

describe("buildFaq", () => {
  const items = buildFaq(BUSINESS_DEFAULTS, false);
  const answerTo = (question: RegExp) =>
    text(items.find((item) => question.test(item.question))?.answer);

  it("answers the confirmed questions", () => {
    expect(answerTo(/pickup and drop/i)).toMatch(/house pickup and dropping/i);
    expect(answerTo(/ladies and gents/i)).toMatch(/both ladies and gents/i);
    expect(answerTo(/where are you located/i)).toMatch(/Kondapur and Hafeezpet/);
    expect(answerTo(/RTA/i)).toMatch(/guide you in all RTA works/i);
  });

  it("does not invent prices: cost questions point to the team", () => {
    const answer = answerTo(/cost/i);
    expect(answer).toContain(
      "Training plans and pricing are available from our team. Contact us for current package details.",
    );
    expect(answer).not.toMatch(/₹|Rs\.?\s?\d|\d+\s?rupees/i);
  });

  it("links to the plans section only when plans exist", () => {
    expect(
      text(buildFaq(BUSINESS_DEFAULTS, false).find((i) => /cost/i.test(i.question))?.answer),
    ).not.toMatch(/Plans section/);
    expect(
      text(buildFaq(BUSINESS_DEFAULTS, true).find((i) => /cost/i.test(i.question))?.answer),
    ).toMatch(/Plans section/);
  });

  it("only claims government recognition when the owner-managed setting has it", () => {
    expect(items.some((i) => /recognised/i.test(i.question))).toBe(true);
    expect(
      buildFaq({ ...BUSINESS_DEFAULTS, recognition: null }, false).some((i) =>
        /recognised/i.test(i.question),
      ),
    ).toBe(false);
  });

  it("does not invent timings", () => {
    expect(answerTo(/timings/i)).toMatch(
      /call or message us on WhatsApp to confirm current timings/i,
    );
    const withHours = buildFaq({ ...BUSINESS_DEFAULTS, workingHours: "Mon-Sat 6am-6pm" }, false);
    expect(text(withHours.find((i) => /timings/i.test(i.question))?.answer)).toBe(
      "Mon-Sat 6am-6pm",
    );
  });
});
