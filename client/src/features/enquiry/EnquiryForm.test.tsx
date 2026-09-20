import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { enquiryCalls, mockPublicApi, renderWithProviders, TEST_PACKAGE } from "@/test/utils";
import { EnquiryForm } from "./EnquiryForm";

afterEach(() => {
  vi.unstubAllGlobals();
});

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const submit = () => fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

function fillValid() {
  type(/your name/i, "Asha Reddy");
  type(/mobile number/i, "96661 46913");
  fireEvent.click(screen.getByLabelText(/I agree/i));
}

describe("EnquiryForm: validation", () => {
  it("shows an error for each required field and sends nothing", async () => {
    const fetchMock = mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    submit();

    expect(await screen.findByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your mobile number.")).toBeInTheDocument();
    expect(screen.getByText("Please tick the box to let us contact you.")).toBeInTheDocument();
    expect(enquiryCalls(fetchMock)).toHaveLength(0);
  });

  it("requires consent even when everything else is valid", async () => {
    const fetchMock = mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    type(/your name/i, "Asha Reddy");
    type(/mobile number/i, "96661 46913");
    submit();
    expect(
      await screen.findByText("Please tick the box to let us contact you."),
    ).toBeInTheDocument();
    expect(enquiryCalls(fetchMock)).toHaveLength(0);
  });

  it("rejects an invalid mobile number and marks the field invalid for assistive tech", async () => {
    mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    fillValid();
    type(/mobile number/i, "12345");
    submit();
    expect(await screen.findByText(/valid 10-digit Indian mobile number/i)).toBeInTheDocument();
    const phone = screen.getByLabelText(/mobile number/i);
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(/valid 10-digit Indian mobile number/i);
  });

  it("moves focus to the first invalid field", async () => {
    mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    submit();
    await waitFor(() => expect(screen.getByLabelText(/your name/i)).toHaveFocus());
  });

  it("has a labelled consent checkbox and labelled optional fields", () => {
    mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    for (const label of [
      /your name/i,
      /mobile number/i,
      /preferred plan/i,
      /preferred branch/i,
      /preferred start date/i,
      /preferred time of day/i,
      /pickup address/i,
      /message/i,
      /I agree/i,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});

describe("EnquiryForm: honeypot", () => {
  it("contains a hidden, unfocusable trap field that real visitors never fill", () => {
    mockPublicApi();
    const { container } = renderWithProviders(<EnquiryForm />);
    const trap = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(trap).not.toBeNull();
    expect(trap?.tabIndex).toBe(-1);
    expect(trap?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(trap?.value).toBe("");
  });

  it("sends the honeypot as an empty string for a real submission", async () => {
    const fetchMock = mockPublicApi();
    renderWithProviders(<EnquiryForm />);
    fillValid();
    submit();
    await screen.findByText("Thanks! Your enquiry has been received.");
    expect(enquiryCalls(fetchMock)[0]).toMatchObject({ website: "" });
  });
});

describe("EnquiryForm: submission", () => {
  it("posts only the filled fields, then shows the confirmation without promising a response time", async () => {
    const fetchMock = mockPublicApi({ packages: [TEST_PACKAGE] });
    renderWithProviders(<EnquiryForm />, { route: "/book?package=test-plan" });
    await waitFor(() =>
      expect((screen.getByLabelText(/preferred plan/i) as HTMLSelectElement).value).toBe(
        "test-plan",
      ),
    );

    fillValid();
    type(/preferred time of day/i, "MORNING");
    submit();

    expect(await screen.findByText("Thanks! Your enquiry has been received.")).toBeInTheDocument();
    expect(screen.getByText("We'll contact you shortly.")).toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent(/within|hours|minutes/i);

    const [body] = enquiryCalls(fetchMock);
    expect(body).toEqual({
      fullName: "Asha Reddy",
      phone: "96661 46913",
      packageSlug: "test-plan",
      preferredTimeWindow: "MORNING",
      consent: true,
      website: "",
    });
  });

  it("ignores a ?package= that is not an active plan", async () => {
    mockPublicApi({ packages: [TEST_PACKAGE] });
    renderWithProviders(<EnquiryForm />, { route: "/book?package=archived-plan" });
    await screen.findByRole("option", { name: "Test Plan" });
    expect((screen.getByLabelText(/preferred plan/i) as HTMLSelectElement).value).toBe("");
  });

  it("prefills a helpful message from ?pickup=1 and ?topic=rta", () => {
    mockPublicApi();
    const { unmount } = renderWithProviders(<EnquiryForm />, { route: "/book?pickup=1" });
    expect((screen.getByLabelText(/message/i) as HTMLTextAreaElement).value).toMatch(/pickup/i);
    unmount();
    renderWithProviders(<EnquiryForm />, { route: "/book?topic=rta" });
    expect((screen.getByLabelText(/message/i) as HTMLTextAreaElement).value).toMatch(/RTA/);
  });

  it("shows the API's field-level message next to the right field", async () => {
    mockPublicApi({
      enquiry: () =>
        new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Some fields are invalid.",
              details: [{ path: "body.phone", message: "Server: bad number." }],
            },
          }),
          { status: 400 },
        ),
    });
    renderWithProviders(<EnquiryForm />);
    fillValid();
    submit();
    expect(await screen.findByText("Server: bad number.")).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Thanks! Your enquiry has been received.")).not.toBeInTheDocument();
  });

  it("explains rate limiting kindly", async () => {
    mockPublicApi({
      enquiry: () =>
        new Response(
          JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many requests." } }),
          { status: 429 },
        ),
    });
    renderWithProviders(<EnquiryForm />);
    fillValid();
    submit();
    expect(await screen.findByText(/several enquiries in a short time/i)).toBeInTheDocument();
  });

  it("shows a generic message on a server error, with no technical detail", async () => {
    mockPublicApi({
      enquiry: () =>
        new Response(
          JSON.stringify({
            error: { code: "INTERNAL_ERROR", message: "relation Enquiry does not exist" },
          }),
          { status: 500 },
        ),
    });
    renderWithProviders(<EnquiryForm />);
    fillValid();
    submit();
    expect(await screen.findByText(/couldn't send your enquiry just now/i)).toBeInTheDocument();
    expect(screen.queryByText(/relation/i)).not.toBeInTheDocument();
  });

  it("keeps what the visitor typed when sending fails, so they can retry", async () => {
    mockPublicApi({ enquiry: () => new Response("{}", { status: 500 }) });
    renderWithProviders(<EnquiryForm />);
    fillValid();
    submit();
    await screen.findByText(/couldn't send your enquiry just now/i);
    expect((screen.getByLabelText(/your name/i) as HTMLInputElement).value).toBe("Asha Reddy");
  });
});
