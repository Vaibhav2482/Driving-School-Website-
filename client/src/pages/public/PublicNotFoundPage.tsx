import { Seo } from "@/components/common/Seo";
import { NotFoundState } from "@/components/site/NotFoundState";

export function PublicNotFoundPage() {
  return (
    <>
      <Seo title="Page not found" noIndex />
      <NotFoundState
        title="We couldn't find that page"
        message="The link may be broken, or the page may have moved."
      />
    </>
  );
}
