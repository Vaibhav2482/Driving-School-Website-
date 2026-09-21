import { useEffect, useState } from "react";

/**
 * Which page section the visitor is reading, for highlighting the menu. A section counts as "active" while it
 * crosses a thin band just above the middle of the screen. Returns `null` above the first section (the hero) or
 * when the browser cannot observe intersections.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    elements.forEach((el) => observer.observe(el));

    // Back in the hero, before the first section: nothing is active.
    const onScroll = () => {
      const first = elements[0];
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.6) setActive(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);

  return active;
}
