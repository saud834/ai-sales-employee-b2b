import type { ComponentType as ReactComponentType } from "react";
import Navbar from "@/lib/components/Navbar";
import Hero from "@/lib/components/Hero";
import Features from "@/lib/components/Features";
import Benefits from "@/lib/components/Benefits";
import Pricing from "@/lib/components/Pricing";
import Testimonials from "@/lib/components/Testimonials";
import FAQ from "@/lib/components/FAQ";
import Gallery from "@/lib/components/Gallery";
import ProductGrid from "@/lib/components/ProductGrid";
import BlogGrid from "@/lib/components/BlogGrid";
import Contact from "@/lib/components/Contact";
import Newsletter from "@/lib/components/Newsletter";
import Footer from "@/lib/components/Footer";
import CTA from "@/lib/components/CTA";
import Stats from "@/lib/components/Stats";
import LogoCloud from "@/lib/components/LogoCloud";
import Team from "@/lib/components/Team";
import Timeline from "@/lib/components/Timeline";
import ComparisonTable from "@/lib/components/ComparisonTable";
import Menu from "@/lib/components/Menu";
import Reservation from "@/lib/components/Reservation";
import LocationHours from "@/lib/components/LocationHours";
import About from "@/lib/components/About";
import type { ComponentType } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<ComponentType, ReactComponentType<any>> = {
  navbar: Navbar,
  hero: Hero,
  features: Features,
  benefits: Benefits,
  pricing: Pricing,
  testimonials: Testimonials,
  faq: FAQ,
  gallery: Gallery,
  productGrid: ProductGrid,
  blogGrid: BlogGrid,
  contact: Contact,
  newsletter: Newsletter,
  footer: Footer,
  cta: CTA,
  stats: Stats,
  logoCloud: LogoCloud,
  team: Team,
  timeline: Timeline,
  comparisonTable: ComparisonTable,
  menu: Menu,
  reservation: Reservation,
  locationHours: LocationHours,
  about: About,
};

export const componentLabels: Record<ComponentType, string> = {
  navbar: "Navbar",
  hero: "Hero",
  features: "Features",
  benefits: "Benefits",
  pricing: "Pricing",
  testimonials: "Testimonials",
  faq: "FAQ",
  gallery: "Gallery",
  productGrid: "Product Grid",
  blogGrid: "Blog Grid",
  contact: "Contact",
  newsletter: "Newsletter",
  footer: "Footer",
  cta: "Call to Action",
  stats: "Stats",
  logoCloud: "Logo Cloud",
  team: "Team",
  timeline: "Timeline",
  comparisonTable: "Comparison Table",
  menu: "Menu",
  reservation: "Reservation",
  locationHours: "Location & Hours",
  about: "About",
};
