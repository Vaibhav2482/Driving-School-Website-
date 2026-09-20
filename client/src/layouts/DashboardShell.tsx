import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { SITE_NAME } from "@/config/site";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/cn";

interface DashboardShellProps {
  /** Area name shown under the brand, e.g. "Admin". */
  area: string;
  nav: NavItem[];
}

function NavList({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {nav.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </>
        );

        return (
          <li key={item.label}>
            {item.to ? (
              <NavLink
                to={item.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-control border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-accent-500 bg-white/10 text-white"
                      : "border-transparent text-brand-100 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                {content}
              </NavLink>
            ) : (
              // Not built yet: shown so the final structure is visible, but not clickable.
              <span
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-control border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-brand-300/70"
              >
                {content}
                {item.phase !== undefined && (
                  <Badge
                    tone="neutral"
                    className="ml-auto bg-white/5 text-[10px] text-brand-200 ring-white/10"
                  >
                    Phase {item.phase}
                  </Badge>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Shared frame for the admin, student and instructor areas: a fixed sidebar on large screens and a
 * top bar with a collapsible menu on phones and tablets.
 */
export function DashboardShell({ area, nav }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Private areas must never be indexed. */}
      <meta name="robots" content="noindex, nofollow" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-overlay"
      >
        Skip to content
      </a>

      <aside className="bg-brand-900 text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-0 lg:px-5 lg:pt-6 lg:pb-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="" width="32" height="32" className="size-8 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm leading-tight font-semibold">
                {SITE_NAME}
              </span>
              <span className="block text-xs text-brand-200">{area}</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-control p-2 text-brand-100 hover:bg-white/10 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="dashboard-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>

        <nav
          id="dashboard-nav"
          aria-label={`${area} navigation`}
          className={cn("px-3 pb-4 lg:block lg:pb-6", menuOpen ? "block" : "hidden")}
        >
          <NavList nav={nav} onNavigate={() => setMenuOpen(false)} />
        </nav>
      </aside>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
