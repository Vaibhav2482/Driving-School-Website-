import type { ReactNode } from "react";
import { Link } from "react-router";
import type { BusinessInfo } from "@/config/business-defaults";

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

/**
 * FAQ content. Every answer states only what the client has confirmed (ladies & gents training, house
 * pickup & drop, RTA guidance, the Kondapur and Hafeezpet branches, government recognition). Anything
 * unknown (prices, timings, documents, batch sizes…) is answered with "contact us", never guessed.
 */
export function buildFaq(business: BusinessInfo, hasPackages: boolean): FaqItem[] {
  const items: FaqItem[] = [
    {
      question: "Do you provide pickup and drop?",
      answer:
        "Yes. We offer house pickup and dropping. Tell us where you are when you enquire and we'll let you know what we can arrange for your area.",
    },
    {
      question: "Do you provide training for ladies and gents?",
      answer: "Yes. Our driving training is available for both ladies and gents.",
    },
    {
      question: "Where are you located?",
      answer: (
        <>
          We have two branches in Hyderabad: Kondapur and Hafeezpet. Our Kondapur branch is at{" "}
          {business.addressLines.join(", ")}.
        </>
      ),
    },
    {
      question: "How much do driving lessons cost?",
      answer: (
        <>
          Training plans and pricing are available from our team. Contact us for current package
          details.
          {hasPackages && (
            <>
              {" "}
              You can also see our current plans on the{" "}
              <Link
                to="/packages"
                className="font-semibold text-brand-800 underline underline-offset-2"
              >
                Packages page
              </Link>
              .
            </>
          )}
        </>
      ),
    },
    {
      question: "Can you help with RTA work?",
      answer:
        "Yes. We guide you in all RTA works. Contact us and tell us what you need, and our team will guide you.",
    },
    {
      question: "How do I book a lesson?",
      answer: (
        <>
          Send us an enquiry using the{" "}
          <Link to="/book" className="font-semibold text-brand-800 underline underline-offset-2">
            enquiry form
          </Link>
          , call us, or message us on WhatsApp. We&apos;ll get in touch to take it forward.
        </>
      ),
    },
  ];

  if (business.recognition) {
    items.push({
      question: "Is the school recognised?",
      answer: `Yes. ${business.name} is ${business.recognition.replace(/^Recognised/i, "recognised")}.`,
    });
  }

  items.push({
    question: "What are your timings?",
    answer:
      business.workingHours ?? "Please call or message us on WhatsApp to confirm current timings.",
  });

  return items;
}
