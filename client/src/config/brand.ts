/**
 * Brand assets. Both are `null` today because the client has not yet supplied a high-resolution or
 * vector logo, or real photography. While `null`, the site renders a temporary text logo treatment and a
 * designed vector illustration.
 *
 * TO REPLACE WITH REAL ASSETS: drop the file into `client/src/assets/` (or `client/public/`), import it
 * (or use a `/public` URL), and set it below. No component needs to change.
 *
 *   import logoUrl from "@/assets/logo.svg";
 *   export const brandLogo: BrandImage | null = { src: logoUrl, alt: "Sri Sai Balaji Driving School" };
 */
export interface BrandImage {
  src: string;
  alt: string;
  /** Intrinsic size, used to reserve space and avoid layout shift. */
  width?: number;
  height?: number;
}

/** The client's real logo. `null` = use the temporary text logo. */
export const brandLogo: BrandImage | null = null;

/** Hero photograph (a real photo of a car or training on the road). `null` = use the vector illustration. */
export const heroImage: BrandImage | null = null;
