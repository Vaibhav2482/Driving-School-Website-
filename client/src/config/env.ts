import { z } from "zod";

const envSchema = z.object({
  /** Public origin of the deployed site, e.g. https://www.example.com. Enables canonical/OG URLs. */
  VITE_SITE_URL: z
    .url()
    .optional()
    .transform((value) => value?.replace(/\/+$/, "")),
});

/** Validated public (browser-safe) configuration. Fails at startup if it is malformed. */
export const env = envSchema.parse({
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL || undefined,
});
