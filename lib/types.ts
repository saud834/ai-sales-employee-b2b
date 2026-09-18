export type ComponentType =
  | "navbar"
  | "hero"
  | "features"
  | "benefits"
  | "pricing"
  | "testimonials"
  | "faq"
  | "gallery"
  | "productGrid"
  | "blogGrid"
  | "contact"
  | "newsletter"
  | "footer"
  | "cta"
  | "stats"
  | "logoCloud"
  | "team"
  | "timeline"
  | "comparisonTable"
  | "menu"
  | "reservation"
  | "locationHours"
  | "about";

export interface CTAButton {
  label: string;
  href: string;
  style?: "primary" | "secondary" | "ghost";
}

export interface ThemeSpec {
  mode: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  inkColor: string;
  fontHeading: string;
  fontBody: string;
  radius: "none" | "sm" | "md" | "lg" | "xl";
  density: "compact" | "comfortable" | "spacious";
}

export interface SEOSpec {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface SectionSpec {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
}

export interface PageSpec {
  id: string;
  slug: string;
  name: string;
  seo: SEOSpec;
  sections: SectionSpec[];
  /** Overrides the site-wide meta.language/direction for this page only —
   * used for bilingual sites where each language lives on its own page. */
  language?: "ar" | "en";
  direction?: "ltr" | "rtl";
}

export interface NavLink {
  label: string;
  href: string;
}

export interface WebsiteMeta {
  siteName: string;
  tagline: string;
  websiteType: string;
  industry: string;
  targetAudience: string;
  brandPersonality: string[];
  ctaStrategy: string;
  language: "ar" | "en";
  direction: "ltr" | "rtl";
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface AssetSpec {
  id: string;
  url: string;
  alt: string;
}

export interface WebsiteSpec {
  meta: WebsiteMeta;
  theme: ThemeSpec;
  nav: NavLink[];
  pages: PageSpec[];
  assets: AssetSpec[];
}

export type LeadStatus = "new" | "contacted" | "demo_sent" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  website?: string | null;
  hasWebsite: boolean;
  evidence: string;
  sourceUrls: string[];
  notes?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  leadId: string | null;
  spec: WebsiteSpec;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  projectId: string;
  spec: WebsiteSpec;
  label: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
