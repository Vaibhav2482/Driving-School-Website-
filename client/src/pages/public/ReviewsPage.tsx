import { Seo } from "@/components/common/Seo";
import { FinalCta } from "@/components/site/FinalCta";
import { PageHero } from "@/components/site/PageHero";
import { ReviewsGrid } from "@/components/site/ReviewsSection";
import { Section } from "@/components/site/Section";

export function ReviewsPage() {
  return (
    <>
      <Seo
        title="Reviews"
        description="What learners say about Sri Sai Balaji Driving School in Hyderabad."
        path="/reviews"
      />
      <PageHero
        eyebrow="Reviews"
        title="What our learners say"
        description="Feedback from the people we've trained."
      />
      <Section tone="white">
        <ReviewsGrid />
      </Section>
      <FinalCta />
    </>
  );
}
