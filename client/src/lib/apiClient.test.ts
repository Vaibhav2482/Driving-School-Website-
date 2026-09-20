import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, getErrorMessage } from "./apiClient";

function mockFetch(response: Response | Error) {
  const fn = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("returns the { data } envelope and calls the versioned base URL", async () => {
    const fetchMock = mockFetch(json({ data: { status: "ok" } }));
    const result = await apiRequest<{ status: string }>("/health");
    expect(result.data.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("serialises query parameters and skips empty ones", async () => {
    const fetchMock = mockFetch(json({ data: [] }));
    await apiRequest("/packages", {
      query: { status: "ACTIVE", page: 2, q: "", missing: undefined },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/packages?status=ACTIVE&page=2",
      expect.anything(),
    );
  });

  it("sends JSON bodies with the right header", async () => {
    const fetchMock = mockFetch(json({ data: { id: "1" } }, 201));
    await apiRequest("/enquiries", { method: "POST", body: { fullName: "Asha" } });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.body).toBe(JSON.stringify({ fullName: "Asha" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("turns the API error envelope into an ApiError with code, message and details", async () => {
    mockFetch(
      json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Some fields are invalid.",
            details: [{ path: "body.phone" }],
          },
        },
        400,
      ),
    );
    const error = await apiRequest("/enquiries", { method: "POST", body: {} }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Some fields are invalid.",
    });
    expect((error as ApiError).details).toEqual([{ path: "body.phone" }]);
  });

  it("copes with non-JSON error responses (e.g. a proxy error page)", async () => {
    mockFetch(new Response("<html>Bad gateway</html>", { status: 502 }));
    const error = await apiRequest("/health").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, code: "UNKNOWN_ERROR" });
  });

  it("reports network failures with a friendly message", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    const error = await apiRequest("/health").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    expect(getErrorMessage(error)).toMatch(/could not reach the server/i);
  });

  it("rejects a 200 response that is not in the { data } envelope", async () => {
    mockFetch(json({ hello: "world" }));
    const error = await apiRequest("/health").catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("never shows raw error text for unknown thrown values", () => {
    expect(getErrorMessage(new Error("SELECT * FROM secrets"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
