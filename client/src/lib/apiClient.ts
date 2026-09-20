import { env } from "@/config/env";

/** Success envelope returned by every API endpoint. */
export interface ApiResponse<T, M = undefined> {
  data: T;
  meta?: M;
}

interface ErrorEnvelope {
  error?: { code?: unknown; message?: unknown; details?: unknown };
}

/** A failed API call, normalised so UI code never has to inspect raw responses. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${env.VITE_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Call the REST API. Throws `ApiError` for HTTP errors, network failures and malformed responses.
 * (Phase 3 adds access-token attachment and a single-flight refresh-on-401 here.)
 */
export async function apiRequest<T, M = undefined>(
  path: string,
  { method = "GET", body, query, signal }: RequestOptions = {},
): Promise<ApiResponse<T, M>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 204) return { data: undefined as T };

  const json = await parseJson(response);

  if (!response.ok) {
    const error = (json as ErrorEnvelope | undefined)?.error;
    throw new ApiError(
      response.status,
      typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
      typeof error?.message === "string"
        ? error.message
        : "Something went wrong. Please try again.",
      error?.details,
    );
  }

  if (typeof json !== "object" || json === null || !("data" in json)) {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The server sent an unexpected response.",
    );
  }
  return json as ApiResponse<T, M>;
}

/** A message that is safe to show to end users for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}
