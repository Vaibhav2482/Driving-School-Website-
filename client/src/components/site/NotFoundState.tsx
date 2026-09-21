import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { Container } from "./Container";

interface NotFoundStateProps {
  title: string;
  message: string;
}

/** A calm, in-layout "not found" state for an unknown URL. */
export function NotFoundState({ title, message }: NotFoundStateProps) {
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
          <Link to="/" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Go to the home page
          </Link>
          <a href="/#contact" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Contact us
          </a>
        </div>
      </Container>
    </section>
  );
}
