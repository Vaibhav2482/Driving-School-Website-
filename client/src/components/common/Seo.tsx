import { env } from "@/config/env";
import { SITE_NAME } from "@/config/site";

export interface SeoProps {
  /** Page title. Rendered as "{title} | {SITE_NAME}". */
  title?: string;
  /** Use instead of `title` when the page needs a fully custom title (the home page). */
  absoluteTitle?: string;
  description?: string;
  /** Path of this page, e.g. "/packages". With VITE_SITE_URL set it becomes the canonical/OG URL. */
  path?: string;
  /** Set for pages that must not appear in search results (auth, admin, portals). */
  noIndex?: boolean;
}

/**
 * Per-page metadata. React 19 hoists `<title>` and `<meta>` rendered anywhere in the tree into
 * `<head>`, so no helmet library is needed. Canonical and Open Graph URLs are only emitted when the
 * public site origin is configured (VITE_SITE_URL), because guessing a domain would be wrong.
 */
export function Seo({ title, absoluteTitle, description, path, noIndex }: SeoProps) {
  const fullTitle = absoluteTitle ?? (title ? `${title} | ${SITE_NAME}` : SITE_NAME);
  const url =
    env.VITE_SITE_URL && path !== undefined
      ? `${env.VITE_SITE_URL}${path === "/" ? "" : path}`
      : null;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
}
