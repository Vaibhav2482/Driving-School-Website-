import { Seo } from "@/components/common/Seo";
import { FinalCta } from "@/components/site/FinalCta";
import { HowItWorks } from "@/components/site/HowItWorks";
import { LadiesGentsSection } from "@/components/site/LadiesGentsSection";
import { PackagesSection } from "@/components/site/PackagesSection";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";

export function CoursesPage() {
  return (
    <>
      <Seo
        title="Driving Courses"
        description="Driving courses at Sri Sai Balaji Driving School, Hyderabad. Practical training for ladies and gents at our Kondapur and Hafeezpet branches."
        path="/courses"
      />
      <PageHero
        eyebrow="Driving courses"
        title="Practical driving training, built around you"
        description="Training for ladies and gents at our Kondapur and Hafeezpet branches, with house pickup and drop options."
      />

      <Section tone="white">
        <SectionHeader
          eyebrow="Training plans"
          title="Our current plans"
          description="Not sure which plan suits you? Tell us about your driving experience and we'll help you choose."
        />
        <PackagesSection />
      </Section>

      <Section tone="canvas">
        <SectionHeader eyebrow="How it works" title="How your training works" />
        <HowItWorks />
      </Section>

      <LadiesGentsSection />
      <FinalCta />
    </>
  );
}
