import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Seo } from "@/components/common/Seo";
import { buttonStyles } from "@/components/ui/button-styles";
import { BranchesSection } from "@/components/site/BranchesSection";
import { FaqList } from "@/components/site/FaqList";
import { FinalCta } from "@/components/site/FinalCta";
import { HomeHero } from "@/components/site/HomeHero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { LadiesGentsSection } from "@/components/site/LadiesGentsSection";
import { PackagesSection } from "@/components/site/PackagesSection";
import { PickupSection } from "@/components/site/PickupSection";
import { ReviewsGrid } from "@/components/site/ReviewsSection";
import { RtaServicesList } from "@/components/site/RtaSection";
import { Section, SectionHeader } from "@/components/site/Section";
import { TrustStrip } from "@/components/site/TrustStrip";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { buildFaq } from "@/features/public/faq";
import { useBusinessInfo, usePackages, useReviews } from "@/features/public/hooks";

const HOME_PACKAGE_LIMIT = 3;
const HOME_REVIEW_LIMIT = 3;
const HOME_FAQ_COUNT = 4;

export function HomePage() {
  const business = useBusinessInfo();
  const { data: packages } = usePackages();
  const { data: reviews } = useReviews();
  const hasReviews = (reviews?.length ?? 0) > 0;
  const hasMorePackages = (packages?.length ?? 0) > HOME_PACKAGE_LIMIT;
  const faq = buildFaq(business, (packages?.length ?? 0) > 0).slice(0, HOME_FAQ_COUNT);

  return (
    <>
      <Seo
        absoluteTitle="Sri Sai Balaji Driving School | Driving Training in Kondapur & Hafeezpet, Hyderabad"
        description="Sri Sai Balaji Driving School in Kondapur and Hafeezpet, Hyderabad. Driving training for ladies and gents, house pickup and drop, and RTA guidance."
        path="/"
      />

      <HomeHero />
      <TrustStrip />

      <Section tone="canvas">
        <SectionHeader
          eyebrow="Why choose us"
          title="Driving lessons designed around you"
          description="Everything you need to learn with confidence, from your first lesson to the RTA paperwork."
        />
        <WhyChooseUs />
      </Section>

      <Section tone="white" id="packages">
        <SectionHeader
          eyebrow="Training plans"
          title="Find the plan that fits you"
          description="Choose a plan, send us an enquiry, and we'll take care of the rest."
          action={
            hasMorePackages ? (
              <Link to="/packages" className={buttonStyles({ variant: "secondary", size: "md" })}>
                View all plans
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            ) : undefined
          }
        />
        <PackagesSection limit={HOME_PACKAGE_LIMIT} />
      </Section>

      <Section tone="canvas">
        <SectionHeader
          eyebrow="How it works"
          title="From first call to confident driving"
          description="A simple path, one step at a time."
        />
        <HowItWorks />
      </Section>

      <PickupSection />
      <LadiesGentsSection />

      <Section tone="canvas">
        <SectionHeader
          eyebrow="RTA assistance"
          title="We guide you in all RTA works"
          description="RTA processes can feel confusing. Our team is here to guide you through them."
        />
        <RtaServicesList />
      </Section>

      <Section tone="white">
        <SectionHeader
          eyebrow="Our branches"
          title="Two branches in Hyderabad"
          description="Visit us at Kondapur or Hafeezpet."
        />
        <BranchesSection />
      </Section>

      {hasReviews && (
        <Section tone="canvas">
          <SectionHeader
            eyebrow="Reviews"
            title="What our learners say"
            action={
              <Link to="/reviews" className={buttonStyles({ variant: "secondary", size: "md" })}>
                Read all reviews
              </Link>
            }
          />
          <ReviewsGrid limit={HOME_REVIEW_LIMIT} />
        </Section>
      )}

      <Section tone={hasReviews ? "white" : "canvas"}>
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered"
          action={
            <Link to="/faq" className={buttonStyles({ variant: "secondary", size: "md" })}>
              See all questions
            </Link>
          }
        />
        <FaqList items={faq} />
      </Section>

      <FinalCta />
    </>
  );
}
