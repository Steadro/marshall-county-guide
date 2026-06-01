import {
  Wheat,
  Palette,
  Car,
  Scissors,
  GraduationCap,
  Landmark,
  Dumbbell,
  Stethoscope,
  Wrench,
  Factory,
  Boxes,
  Briefcase,
  Building2,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  Building,
  Shield,
  Church,
  Users,
  PartyPopper,
  School,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

// Map a category slug to a Lucide icon. Falls back to a generic store icon.
const ICONS: Record<string, LucideIcon> = {
  agriculture: Wheat,
  "arts-and-entertainment": Palette,
  automotive: Car,
  "beauty-and-personal-care": Scissors,
  "childcare-and-education": GraduationCap,
  financial: Landmark,
  "fitness-and-recreation": Dumbbell,
  "health-and-medical": Stethoscope,
  "home-and-trades": Wrench,
  manufacturing: Factory,
  other: Boxes,
  "pets-and-animals": PawPrint,
  "professional-services": Briefcase,
  "real-estate": Building2,
  "restaurant-and-food": UtensilsCrossed,
  "retail-and-shopping": ShoppingBag,
  // Community-guide categories (civic, faith, community, events)
  "government-and-civic": Building,
  "public-safety": Shield,
  "places-of-worship": Church,
  "community-and-nonprofit": Users,
  "wedding-and-event-venues": PartyPopper,
  schools: School,
};

export function iconForCategory(slug: string): LucideIcon {
  return ICONS[slug] ?? Store;
}

export function CategoryIcon({
  slug,
  className,
  strokeWidth = 1.75,
}: {
  slug: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = iconForCategory(slug);
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
