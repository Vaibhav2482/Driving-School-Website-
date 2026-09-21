/**
 * The website is ONE page. Each nav entry scrolls to a section of the home page by its element id
 * (see pages/public/HomePage.tsx). The `href` is absolute ("/#about") so the same links also work from the
 * 404 page.
 */
export interface SectionLink {
  /** The `id` of the section element. */
  id: string;
  label: string;
}

export const sectionNav: SectionLink[] = [
  { id: "about", label: "About" },
  { id: "training", label: "Training" },
  { id: "plans", label: "Plans" },
  { id: "pickup", label: "Pickup" },
  { id: "rta", label: "RTA" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export const sectionHref = (id: string) => `/#${id}`;
