import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Animate only when the browser can observe intersections and the visitor has not asked for less motion. */
function canAnimate(): boolean {
  if (typeof IntersectionObserver === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface RevealProps extends ComponentProps<"div"> {
  /** Stagger siblings by a few tens of milliseconds. */
  delay?: number;
}

/**
 * A subtle fade-and-rise as content scrolls into view. Renders instantly (no animation, nothing
 * hidden) when the visitor prefers reduced motion or the browser lacks IntersectionObserver.
 */
export function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => !canAnimate());

  useEffect(() => {
    const element = ref.current;
    if (shown || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown && delay ? `${delay}ms` : undefined, ...style }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
