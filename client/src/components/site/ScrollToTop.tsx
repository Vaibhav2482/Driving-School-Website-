import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * On client-side navigation, start the new page at the top and move keyboard/screen-reader focus to the
 * main content (as a full page load would). Skipped for in-page anchors and the first render.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (hash) return;
    window.scrollTo({ top: 0, left: 0 });
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}
