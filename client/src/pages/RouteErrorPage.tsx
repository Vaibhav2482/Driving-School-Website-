import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Seo } from "@/components/common/Seo";
import { buttonStyles } from "@/components/ui/button-styles";

/** Shown when a route throws while loading or rendering. Never shows technical details to users. */
export function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (import.meta.env.DEV) console.error(error);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 text-center">
      <Seo title="Something went wrong" noIndex />
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {notFound ? "This page could not be found" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {notFound
            ? "The link may be broken, or the page may have moved."
            : "Please reload the page and try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={buttonStyles({ variant: "secondary" })}
          >
            Reload
          </button>
          <Link to="/" className={buttonStyles({ variant: "primary" })}>
            Go to the home page
          </Link>
        </div>
      </div>
    </main>
  );
}
