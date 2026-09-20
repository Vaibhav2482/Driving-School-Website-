import { Construction } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { Seo } from "./Seo";

export interface PlaceholderPageProps {
  title: string;
  /** Which roadmap phase builds this page, so nobody mistakes it for finished work. */
  phase: number;
  description?: string;
  noIndex?: boolean;
}

/**
 * Honest stand-in for a page that is not built yet. It shows no invented content and states
 * plainly which phase will deliver the real page.
 */
export function PlaceholderPage({ title, phase, description, noIndex }: PlaceholderPageProps) {
  return (
    <>
      <Seo title={title} noIndex={noIndex} />
      <PageHeader title={title} description={description} />
      <EmptyState
        className="mt-8"
        icon={Construction}
        title="Not built yet"
        description={`This page is a placeholder. It will be built in Phase ${phase} of the roadmap.`}
      />
    </>
  );
}
