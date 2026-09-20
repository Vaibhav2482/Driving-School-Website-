import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { Container } from "./Container";

interface NotFoundStateProps {
  title: string;
  message: string;
  /** e.g. "Back to all packages" */
  primaryAction?: { to: string; label: string };
}

/** A calm, in-layout "not found" state for public pages (unknown URL, unknown or archived package). */
export function NotFoundState({ title, message, primaryAction }: NotFoundStateProps) {
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <Container className="text-center">
        <p
          aria-hidden="true"
          className="font-display text-7xl font-semibold tracking-tight text-brand-200 sm:text-8xl"
        >
          404
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {primaryAction && (
            <Link
              to={primaryAction.to}
              className={buttonStyles({ variant: "primary", size: "lg" })}
            >
              {primaryAction.label}
            </Link>
          )}
          <Link to="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Go to the home page
          </Link>
          <Link to="/contact" className={buttonStyles({ variant: "ghost", size: "lg" })}>
            Contact us
          </Link>
        </div>
      </Container>
    </section>
  );
}
