import { Seo } from "@/components/common/Seo";
import { AboutSection } from "@/components/site/AboutSection";
import { ContactSection } from "@/components/site/ContactSection";
import { FaqList } from "@/components/site/FaqList";
import { HomeHero } from "@/components/site/HomeHero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Marquee } from "@/components/site/Marquee";
import { LadiesGentsSection } from "@/components/site/LadiesGentsSection";
import { PackagesSection } from "@/components/site/PackagesSection";
import { PhotoImage } from "@/components/site/PhotoImage";
import { PickupSection } from "@/components/site/PickupSection";
import { Reveal } from "@/components/site/Reveal";
import { StatementBand } from "@/components/site/StatementBand";
import { ReviewsGrid } from "@/components/site/ReviewsSection";
import { RtaServicesList } from "@/components/site/RtaSection";
import { Section, SectionHeader } from "@/components/site/Section";
import { TrustStrip } from "@/components/site/TrustStrip";
import { photos } from "@/config/photos";
import { buildFaq } from "@/features/public/faq";
import { useBusinessInfo, usePackages, useReviews } from "@/features/public/hooks";

/**
 * The whole website: one scrolling page. Sections alternate between warm ivory and obsidian black, and each has
 * an `id` that the header menu scrolls to (see config/public-nav.ts).
 */
export function HomePage() {
  const business = useBusinessInfo();
  const { data: packages } = usePackages();
  const { data: reviews } = useReviews();
  const hasReviews = reviews.length > 0;
  const faq = buildFaq(business, packages.length > 0);

  return (
    <>
      <Seo
        absoluteTitle="Sri Sai Balaji Driving School | Driving Training in Kondapur & Hafeezpet, Hyderabad"
        description="Sri Sai Balaji Driving School in Kondapur and Hafeezpet, Hyderabad. Driving training for ladies and gents, house pickup and drop, and RTA guidance."
        path="/"
      />

      <div id="home">
        <HomeHero />
        <TrustStrip />
      </div>

      <Marquee />

      <AboutSection />

      <LadiesGentsSection />

      <Section tone="canvas" id="plans">
        <SectionHeader
          index="03"
          eyebrow="Training plans"
          title="Find the plan that fits you"
          description="Choose a plan, send us an enquiry, and we'll take care of the rest."
        />
        <PackagesSection />
      </Section>

      <PickupSection />

      <Section tone="canvas" id="process">
        <SectionHeader
          index="05"
          eyebrow="How it works"
          title="From first call to confident driving"
          description="A simple path, one step at a time."
          align="center"
        />
        <HowItWorks />
      </Section>

      <StatementBand />

      <Section tone="navy" id="rta">
        <div className="mb-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <SectionHeader
            tone="navy"
            index="06"
            eyebrow="RTA assistance"
            title="We guide you in all RTA works"
            description="RTA processes can feel confusing. Our team is here to guide you through them."
            className="mb-0 sm:mb-0"
          />
          <Reveal>
            {/* Photograph on the racing diagonal, with a red stripe. */}
            <div className="relative aspect-[16/10]">
              <div className="absolute inset-0 bg-accent-500 [clip-path:polygon(0_0,4%_0,-3%_100%,-8%_100%)]" />
              <div className="absolute inset-0 [clip-path:polygon(7%_0,100%_0,100%_100%,0_100%)]">
                <PhotoImage photo={photos.rta} />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-brand-950/50 to-transparent"
                />
              </div>
            </div>
          </Reveal>
        </div>
        <RtaServicesList />
      </Section>

      {hasReviews && (
        <Section tone="white" id="reviews">
          <SectionHeader eyebrow="Reviews" title="What our learners say" />
          <ReviewsGrid />
        </Section>
      )}

      <Section tone="canvas" id="faq">
        <SectionHeader index="07" eyebrow="FAQ" title="Questions, answered" />
        <FaqList items={faq} />
      </Section>

      <ContactSection />
    </>
  );
}
