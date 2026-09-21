import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setContentForTests } from "@/features/public/content";
import { renderWithRouter, TEST_PACKAGE } from "@/test/utils";
import { EnquiryForm } from "./EnquiryForm";

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const submit = () => fireEvent.click(screen.getByRole("button", { name: /continue on whatsapp/i }));

function fillValid() {
  type(/your name/i, "Asha Reddy");
  type(/mobile number/i, "96661 46913");
}

/** The message the visitor would send, decoded from the WhatsApp link. */
function sentMessage(): string {
  const link = screen.getByRole("link", { name: /send on whatsapp/i });
  const href = link.getAttribute("href") ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/919666146913\?text=/);
  return decodeURIComponent(href.split("?text=")[1] ?? "");
}

describe("EnquiryForm: validation", () => {
  it("shows an error for each required field and does not continue", async () => {
    renderWithRouter(<EnquiryForm />);
    submit();
    expect(await screen.findByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your mobile number.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /send on whatsapp/i })).not.toBeInTheDocument();
  });

  it("rejects an invalid mobile number and marks the field invalid for assistive tech", async () => {
    renderWithRouter(<EnquiryForm />);
    type(/your name/i, "Asha");
    type(/mobile number/i, "12345");
    submit();
    expect(
      await screen.findByText("Please enter a valid 10-digit Indian mobile number."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("moves focus to the first invalid field", async () => {
    renderWithRouter(<EnquiryForm />);
    submit();
    await waitFor(() => expect(screen.getByLabelText(/your name/i)).toHaveFocus());
  });

  it("has labelled fields, and only offers a plan choice when plans exist", () => {
    renderWithRouter(<EnquiryForm />);
    for (const label of [
      /your name/i,
      /mobile number/i,
      /preferred branch/i,
      /preferred start date/i,
      /preferred time of day/i,
      /pickup address/i,
      /message/i,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText(/preferred plan/i)).not.toBeInTheDocument();
  });

  it("offers the plans that exist", () => {
    setContentForTests({ packages: [TEST_PACKAGE] });
    renderWithRouter(<EnquiryForm />);
    expect(screen.getByRole("option", { name: "Test Plan" })).toBeInTheDocument();
  });

  it("asks for no consent checkbox and has no hidden spam-trap field (there is no server)", () => {
    renderWithRouter(<EnquiryForm />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/website/i)).not.toBeInTheDocument();
  });
});

describe("EnquiryForm: hand-off to WhatsApp", () => {
  it("turns a valid enquiry into a ready-to-send WhatsApp message to the school", async () => {
    renderWithRouter(<EnquiryForm />);
    fillValid();
    submit();
    expect(
      await screen.findByRole("heading", { name: "Your enquiry is ready" }),
    ).toBeInTheDocument();
    expect(sentMessage()).toBe(
      [
        "Hello Sri Sai Balaji Driving School, I'd like to enquire about driving lessons.",
        "",
        "Name: Asha Reddy",
        "Mobile: 96661 46913",
      ].join("\n"),
    );
    const link = screen.getByRole("link", { name: /send on whatsapp/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("does not promise a confirmed booking or a response time", async () => {
    renderWithRouter(<EnquiryForm />);
    fillValid();
    submit();
    await screen.findByRole("heading", { name: "Your enquiry is ready" });
    expect(document.body.textContent).toMatch(/not a confirmed booking/i);
    expect(document.body.textContent).not.toMatch(/within|minutes|hours|24/i);
  });

  it("includes the optional details that were filled in, and only those", async () => {
    setContentForTests({ packages: [TEST_PACKAGE] });
    renderWithRouter(<EnquiryForm />);
    fillValid();
    type(/preferred plan/i, "test-plan");
    type(/preferred branch/i, "hafeezpet");
    type(/preferred time of day/i, "MORNING");
    type(/pickup address/i, "Plot 1, Some Colony");
    type(/message/i, "Ladies batch please");
    submit();
    await screen.findByRole("heading", { name: "Your enquiry is ready" });
    const message = sentMessage();
    expect(message).toContain("Preferred plan: Test Plan");
    expect(message).toContain("Preferred branch: Hafeezpet");
    expect(message).toContain("Preferred time: Morning");
    expect(message).toContain("Pickup address: Plot 1, Some Colony");
    expect(message).toContain("Message: Ladies batch please");
    expect(message).not.toContain("Preferred start date");
  });

  it("offers a call as well, and lets the visitor go back without losing what they typed", async () => {
    renderWithRouter(<EnquiryForm />);
    fillValid();
    submit();
    await screen.findByRole("heading", { name: "Your enquiry is ready" });
    expect(screen.getByRole("link", { name: /call 9666 146 913/i })).toHaveAttribute(
      "href",
      "tel:+919666146913",
    );
    fireEvent.click(screen.getByRole("button", { name: /change my details/i }));
    expect(screen.getByLabelText(/your name/i)).toHaveValue("Asha Reddy");
  });
});
