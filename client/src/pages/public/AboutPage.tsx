import { Seo } from "@/components/common/Seo";
import { BranchesSection } from "@/components/site/BranchesSection";
import { FinalCta } from "@/components/site/FinalCta";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeader } from "@/components/site/Section";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { useBusinessInfo } from "@/features/public/hooks";

/**
 * About page: only confirmed facts. The owner's story, years of operation, instructor profiles and
 * photographs are not yet supplied, so none are shown. They can be added when the client provides them.
 */
export function AboutPage() {
  const business = useBusinessInfo();

  const facts: { label: string; value: string }[] = [
    ...(business.proprietor ? [{ label: "Proprietor", value: business.proprietor }] : []),
    ...(business.recognition ? [{ label: "Recognition", value: business.recognition }] : []),
    { label: "Branches", value: "Kondapur and Hafeezpet, Hyderabad" },
    { label: "Training", value: "Ladies and gents" },
    { label: "Also offered", value: "House pickup & dropping, RTA guidance" },
  ];

  return (
    <>
      <Seo
        title="About us"
        description="About Sri Sai Balaji Driving School: driving training for ladies and gents in Kondapur and Hafeezpet, Hyderabad, with house pickup and drop and RTA guidance."
        path="/about"
      />
      <PageHero
        eyebrow="About us"
        title="About Sri Sai Balaji Driving School"
        description="A driving school in Hyderabad, with branches in Kondapur and Hafeezpet."
      />

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <Reveal>
            <SectionHeader
              eyebrow="Who we are"
              title="Driving training you can rely on"
              className="mb-6 sm:mb-6"
            />
            <div className="space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Sri Sai Balaji Driving School offers driving training in Hyderabad, with branches in
                Kondapur and Hafeezpet. We train ladies and gents, and we offer house pickup and
                dropping to make learning easier to fit into your day.
              </p>
              <p>
                We also guide you in all RTA works, so you have support with the paperwork as well
                as the driving.
              </p>
              {business.recognition && (
                <p className="font-medium text-ink">{business.recognition}.</p>
              )}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <dl className="divide-y divide-line rounded-2xl border border-line bg-canvas">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="grid gap-1 px-6 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
                >
                  <dt className="text-sm font-medium text-muted">{fact.label}</dt>
                  <dd className="font-medium text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeader
          eyebrow="What we offer"
          title="Training, convenience and guidance"
          description="Everything we offer is built around making it easier for you to learn to drive."
        />
        <WhyChooseUs />
      </Section>

      <Section tone="white">
        <SectionHeader eyebrow="Find us" title="Our branches" />
        <BranchesSection />
      </Section>

      <FinalCta />
    </>
  );
}
