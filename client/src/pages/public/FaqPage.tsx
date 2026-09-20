import { Seo } from "@/components/common/Seo";
import { FaqList } from "@/components/site/FaqList";
import { FinalCta } from "@/components/site/FinalCta";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { buildFaq } from "@/features/public/faq";
import { useBusinessInfo, usePackages } from "@/features/public/hooks";

export function FaqPage() {
  const business = useBusinessInfo();
  const { data: packages } = usePackages();

  return (
    <>
      <Seo
        title="FAQ"
        description="Answers to common questions about Sri Sai Balaji Driving School in Hyderabad: pickup and drop, training for ladies and gents, RTA guidance, locations and booking."
        path="/faq"
      />
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Quick answers about our training, pickup and drop, RTA guidance and how to get started."
      />
      <Section tone="white">
        <div className="mx-auto max-w-3xl">
          <FaqList items={buildFaq(business, (packages?.length ?? 0) > 0)} />
        </div>
      </Section>
      <FinalCta title="Still have a question?" />
    </>
  );
}
