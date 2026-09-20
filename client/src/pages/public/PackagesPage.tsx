import { Seo } from "@/components/common/Seo";
import { FinalCta } from "@/components/site/FinalCta";
import { PackagesSection } from "@/components/site/PackagesSection";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export function PackagesPage() {
  return (
    <>
      <Seo
        title="Driving Packages"
        description="Driving training packages at Sri Sai Balaji Driving School, Hyderabad. See the current plans, lessons included and how to enquire."
        path="/packages"
      />
      <PageHero
        eyebrow="Packages"
        title="Choose your training plan"
        description="Compare our current plans. Not sure which one is right for you? Contact us and we'll help you choose."
      />
      <Section tone="white">
        <PackagesSection />
      </Section>
      <FinalCta />
    </>
  );
}
