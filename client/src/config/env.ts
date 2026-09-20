import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .min(1)
    .default("/api/v1")
    .transform((value) => value.replace(/\/+$/, "")),
  /** Public origin of the deployed site, e.g. https://www.example.com. Enables canonical/OG URLs. */
  VITE_SITE_URL: z
    .url()
    .optional()
    .transform((value) => value?.replace(/\/+$/, "")),
});

/** Validated public (browser-safe) configuration. Fails at startup if it is malformed. */
export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || undefined,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL || undefined,
});

/**
 * PHASE 1 ONLY. Real authentication lands in Phase 3; until then the role guards would hide every
 * admin/student/instructor placeholder. In DEVELOPMENT builds, this flag lets the guards pass so the
 * layouts can be reviewed. It is always false in production builds, and it never affects the backend,
 * which enforces permissions itself. Remove in Phase 3.
 */
export function isDevAuthBypassEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH_GUARDS === "true";
}
