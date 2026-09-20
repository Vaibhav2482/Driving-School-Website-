import {
  Bell,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Car,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Package,
  Route,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Route path. Omitted while the page does not exist yet; the item is then shown disabled. */
  to?: string;
  /** Roadmap phase that delivers this page (shown on disabled items). */
  phase?: number;
}

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Enquiries", icon: Inbox, phase: 5 },
  { label: "Students", icon: Users, phase: 5 },
  { label: "Instructors", icon: UserCog, phase: 5 },
  { label: "Bookings", icon: CalendarClock, phase: 6 },
  { label: "Packages", icon: Package, phase: 4 },
  { label: "Payments", icon: CreditCard, phase: 9 },
  { label: "Vehicles", icon: Car, phase: 8 },
  { label: "Lessons", icon: CalendarDays, phase: 7 },
  { label: "Progress", icon: Route, phase: 7 },
  { label: "RTA Services", icon: ShieldCheck, phase: 4 },
  { label: "Reviews", icon: Star, phase: 4 },
  { label: "Reports", icon: BarChart3, phase: 12 },
  { label: "Notifications", icon: Bell, phase: 12 },
  { label: "Settings", icon: Settings, phase: 4 },
];

export const studentNav: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard },
  { label: "Bookings", icon: CalendarClock, phase: 10 },
  { label: "Lessons", icon: CalendarDays, phase: 10 },
  { label: "Progress", icon: Route, phase: 10 },
  { label: "My package", icon: Package, phase: 10 },
  { label: "Payments", icon: CreditCard, phase: 10 },
  { label: "Notifications", icon: Bell, phase: 10 },
  { label: "Profile", icon: GraduationCap, phase: 10 },
];

export const instructorNav: NavItem[] = [
  { label: "Dashboard", to: "/instructor", icon: LayoutDashboard },
  { label: "Today's schedule", icon: CalendarClock, phase: 11 },
  { label: "Students", icon: Users, phase: 11 },
  { label: "Lessons", icon: BookOpen, phase: 11 },
  { label: "Progress", icon: ClipboardList, phase: 11 },
  { label: "Profile", icon: UserCog, phase: 11 },
];
