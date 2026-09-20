import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import { FullPageSpinner } from "@/components/common/FullPageSpinner";
import { ADMIN_AREA_ROLES, INSTRUCTOR_AREA_ROLES, STUDENT_AREA_ROLES } from "@/features/auth/roles";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { HomePage } from "@/pages/public/HomePage";
import { PublicNotFoundPage } from "@/pages/public/PublicNotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { RequireRole } from "./guards/RequireRole";

/** Lazy-load a page component so each public page is its own chunk (the home page stays eager). */
const lazyPage =
  <T extends Record<string, ComponentType>>(load: () => Promise<T>, name: keyof T & string) =>
  async () => ({ Component: (await load())[name] });

/**
 * Route table. The home page ships in the main bundle; other public pages, the admin, student and instructor areas (and
 * the dev design-system page) are lazy-loaded, so public visitors never download that code.
 *
 * Guards here are a UX layer only; the API authorises every request itself.
 */
export const routes: RouteObject[] = [
  {
    HydrateFallback: FullPageSpinner,
    errorElement: <RouteErrorPage />,
    children: [
      // ── Public website ───────────────────────────────────────────────
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "about", lazy: lazyPage(() => import("@/pages/public/AboutPage"), "AboutPage") },
          {
            path: "courses",
            lazy: lazyPage(() => import("@/pages/public/CoursesPage"), "CoursesPage"),
          },
          {
            path: "packages",
            lazy: lazyPage(() => import("@/pages/public/PackagesPage"), "PackagesPage"),
          },
          {
            path: "packages/:slug",
            lazy: lazyPage(() => import("@/pages/public/PackageDetailPage"), "PackageDetailPage"),
          },
          {
            path: "rta-services",
            lazy: lazyPage(() => import("@/pages/public/RtaServicesPage"), "RtaServicesPage"),
          },
          {
            path: "contact",
            lazy: lazyPage(() => import("@/pages/public/ContactPage"), "ContactPage"),
          },
          { path: "book", lazy: lazyPage(() => import("@/pages/public/BookPage"), "BookPage") },
          { path: "faq", lazy: lazyPage(() => import("@/pages/public/FaqPage"), "FaqPage") },
          {
            path: "reviews",
            lazy: lazyPage(() => import("@/pages/public/ReviewsPage"), "ReviewsPage"),
          },
          // Any other URL: a friendly 404 inside the site layout.
          { path: "*", element: <PublicNotFoundPage /> },
        ],
      },

      // ── Authentication ───────────────────────────────────────────────
      { path: "auth/login", element: <LoginPage /> },

      // ── Admin (SUPER_ADMIN, OWNER, ADMIN) ────────────────────────────
      {
        path: "admin",
        element: <RequireRole roles={ADMIN_AREA_ROLES} />,
        children: [
          {
            lazy: async () => ({ Component: (await import("@/layouts/AdminLayout")).AdminLayout }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("@/pages/admin/AdminDashboardPage")).AdminDashboardPage,
                }),
              },
            ],
          },
        ],
      },

      // ── Student portal ───────────────────────────────────────────────
      {
        path: "student",
        element: <RequireRole roles={STUDENT_AREA_ROLES} />,
        children: [
          {
            lazy: async () => ({
              Component: (await import("@/layouts/StudentLayout")).StudentLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("@/pages/student/StudentDashboardPage"))
                    .StudentDashboardPage,
                }),
              },
            ],
          },
        ],
      },

      // ── Instructor portal ────────────────────────────────────────────
      {
        path: "instructor",
        element: <RequireRole roles={INSTRUCTOR_AREA_ROLES} />,
        children: [
          {
            lazy: async () => ({
              Component: (await import("@/layouts/InstructorLayout")).InstructorLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("@/pages/instructor/InstructorDashboardPage"))
                    .InstructorDashboardPage,
                }),
              },
            ],
          },
        ],
      },

      // ── Development-only style guide (not present in production builds) ──
      ...(import.meta.env.DEV
        ? ([
            {
              path: "dev/design-system",
              lazy: async () => ({
                Component: (await import("@/pages/dev/DesignSystemPage")).DesignSystemPage,
              }),
            },
          ] satisfies RouteObject[])
        : []),
    ],
  },
];
