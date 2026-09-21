import { redirect, type RouteObject } from "react-router";
import { FullPageSpinner } from "@/components/common/FullPageSpinner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { HomePage } from "@/pages/public/HomePage";
import { PublicNotFoundPage } from "@/pages/public/PublicNotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";

/**
 * The website is a single page. Old multi-page URLs (from earlier versions or shared links) redirect to the
 * matching section of the home page.
 */
const LEGACY_PAGES: [path: string, section: string][] = [
  ["about", "about"],
  ["courses", "training"],
  ["packages", "plans"],
  ["packages/:slug", "plans"],
  ["rta-services", "rta"],
  ["contact", "contact"],
  ["book", "contact"],
  ["faq", "faq"],
  ["reviews", "about"],
];

export const routes: RouteObject[] = [
  {
    HydrateFallback: FullPageSpinner,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          ...LEGACY_PAGES.map(([path, section]) => ({
            path,
            loader: () => redirect(`/#${section}`),
          })),
          { path: "*", element: <PublicNotFoundPage /> },
        ],
      },
    ],
  },
];
