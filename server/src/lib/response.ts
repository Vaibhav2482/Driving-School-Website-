import type { Response } from "express";

/** Successful responses are always `{ data }` or `{ data, meta }`. */
export interface SuccessBody<T, M = undefined> {
  data: T;
  meta?: M;
}

/** Error responses are always `{ error: { code, message, details? } }`. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendData<T, M extends Record<string, unknown> | undefined = undefined>(
  res: Response,
  data: T,
  options: { status?: number; meta?: M } = {},
): void {
  const body: SuccessBody<T, M> =
    options.meta === undefined ? { data } : { data, meta: options.meta };
  res.status(options.status ?? 200).json(body);
}
