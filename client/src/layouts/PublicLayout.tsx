import { Outlet } from "react-router";
import { BusinessJsonLd } from "@/components/site/BusinessJsonLd";
import { MobileActionBar } from "@/components/site/MobileActionBar";
import { NavigationProgress } from "@/components/site/NavigationProgress";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Shell for every public page: header, main content, footer and the mobile action bar. */
export function PublicLayout() {
  return (
    // Bottom padding on phones keeps the footer clear of the sticky action bar.
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:shadow-overlay"
      >
        Skip to content
      </a>
      <NavigationProgress />
      <ScrollToTop />
      <BusinessJsonLd />

      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileActionBar />
    </div>
  );
}
