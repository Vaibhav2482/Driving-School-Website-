export interface PublicNavLink {
  to: string;
  label: string;
  end?: boolean;
}

/** Main navigation for the public website (header and mobile menu). */
export const mainNav: PublicNavLink[] = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/packages", label: "Packages" },
  { to: "/rta-services", label: "RTA Services" },
  { to: "/contact", label: "Contact" },
];

/** Extra links shown in the footer. */
export const footerNav: PublicNavLink[] = [
  ...mainNav,
  { to: "/faq", label: "FAQ" },
  { to: "/reviews", label: "Reviews" },
];
