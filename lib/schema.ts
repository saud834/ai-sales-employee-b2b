import { z } from "zod";

// ---------------------------------------------------------------------------
// This module is the safety boundary of the whole system: every website spec
// the AI produces (initial plan or an edit) must pass through here before it
// is stored or rendered. Nothing that fails validation ever reaches the
// component renderer or the code exporter.
// ---------------------------------------------------------------------------

export const ctaButtonSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(500),
  style: z.enum(["primary", "secondary", "ghost"]).optional(),
});

export const navLinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(200),
});

export const featureItemSchema = z.object({
  icon: z.string().max(40).optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
});

export const testimonialItemSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(150).optional(),
  quote: z.string().min(1).max(600),
  avatar: z.string().max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const faqItemSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(1200),
});

export const pricingPlanSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.string().min(1).max(40),
  period: z.string().max(40).optional(),
  description: z.string().max(300).optional(),
  features: z.array(z.string().max(200)).max(20),
  cta: ctaButtonSchema.optional(),
  highlighted: z.boolean().optional(),
});

export const galleryImageSchema = z.object({
  // Empty string is a valid, intentional value: the renderer shows a
  // placeholder box until a real photo is uploaded and this is set.
  url: z.string().max(500),
  alt: z.string().min(1).max(200),
  caption: z.string().max(200).optional(),
});

export const productItemSchema = z.object({
  name: z.string().min(1).max(150),
  price: z.string().max(40).optional(),
  image: z.string().max(500).optional(),
  description: z.string().max(400).optional(),
  href: z.string().max(300).optional(),
});

export const blogPostItemSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(400).optional(),
  image: z.string().max(500).optional(),
  date: z.string().max(60).optional(),
  href: z.string().max(300).optional(),
});

export const statItemSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
});

export const logoItemSchema = z.object({
  name: z.string().min(1).max(80),
  image: z.string().max(500).optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(150).optional(),
  photo: z.string().max(500).optional(),
  bio: z.string().max(400).optional(),
});

export const timelineItemSchema = z.object({
  date: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  description: z.string().max(400).optional(),
});

export const comparisonRowSchema = z.object({
  feature: z.string().min(1).max(150),
  values: z.array(z.union([z.string(), z.boolean()])).max(10),
});

export const menuItemSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(300).optional(),
  price: z.string().max(40).optional(),
  image: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(6).optional(),
});

export const menuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  items: z.array(menuItemSchema).max(40),
});

export const hoursEntrySchema = z.object({
  day: z.string().min(1).max(30),
  hours: z.string().min(1).max(60),
});

export const footerColumnSchema = z.object({
  title: z.string().min(1).max(80),
  links: z.array(navLinkSchema).max(12),
});

export const socialLinkSchema = z.object({
  platform: z.string().min(1).max(30),
  href: z.string().min(1).max(300),
});

// ---- per-component props -----------------------------------------------

const navbarPropsSchema = z.object({
  logoText: z.string().min(1).max(60),
  links: z.array(navLinkSchema).max(10),
  cta: ctaButtonSchema.optional(),
  sticky: z.boolean().optional(),
});

const heroPropsSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  headline: z.string().min(1).max(200),
  subheadline: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  primaryCta: ctaButtonSchema.optional(),
  secondaryCta: ctaButtonSchema.optional(),
  alignment: z.enum(["left", "center"]).optional(),
});

const featuresPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  items: z.array(featureItemSchema).min(1).max(12),
});

const benefitsPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  items: z.array(featureItemSchema).min(1).max(10),
  image: z.string().max(500).optional(),
  imagePosition: z.enum(["left", "right"]).optional(),
});

const pricingPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  plans: z.array(pricingPlanSchema).min(1).max(6),
});

const testimonialsPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  items: z.array(testimonialItemSchema).min(1).max(12),
});

const faqPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  items: z.array(faqItemSchema).min(1).max(20),
});

const galleryPropsSchema = z.object({
  heading: z.string().max(200).optional(),
  images: z.array(galleryImageSchema).min(1).max(30),
});

const productGridPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  items: z.array(productItemSchema).min(1).max(30),
});

const blogGridPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  posts: z.array(blogPostItemSchema).min(1).max(20),
});

const contactPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(400).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  whatsapp: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  showForm: z.boolean().optional(),
});

const newsletterPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(300).optional(),
  placeholder: z.string().max(80).optional(),
});

const footerPropsSchema = z.object({
  columns: z.array(footerColumnSchema).max(6),
  socialLinks: z.array(socialLinkSchema).max(8).optional(),
  copyrightText: z.string().min(1).max(200),
});

const ctaPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  primaryCta: ctaButtonSchema,
  secondaryCta: ctaButtonSchema.optional(),
});

const statsPropsSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z.array(statItemSchema).min(1).max(8),
});

const logoCloudPropsSchema = z.object({
  heading: z.string().max(200).optional(),
  logos: z.array(logoItemSchema).min(1).max(12),
});

const teamPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  members: z.array(teamMemberSchema).min(1).max(20),
});

const timelinePropsSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z.array(timelineItemSchema).min(1).max(10),
});

const comparisonTablePropsSchema = z.object({
  heading: z.string().max(200).optional(),
  columns: z.array(z.string().max(60)).min(1).max(6),
  rows: z.array(comparisonRowSchema).min(1).max(20),
});

const menuPropsSchema = z.object({
  heading: z.string().max(200).optional(),
  subheading: z.string().max(300).optional(),
  categories: z.array(menuCategorySchema).min(1).max(12),
});

const reservationPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(400).optional(),
  whatsapp: z.string().max(40).optional(),
  phone: z.string().max(40).optional(),
});

const locationHoursPropsSchema = z.object({
  heading: z.string().max(200).optional(),
  address: z.string().min(1).max(300),
  mapEmbedUrl: z.string().max(1000).optional(),
  hours: z.array(hoursEntrySchema).min(1).max(7),
});

const aboutPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  image: z.string().max(500).optional(),
  stats: z.array(statItemSchema).max(6).optional(),
});

const sectionPropsByType = {
  navbar: navbarPropsSchema,
  hero: heroPropsSchema,
  features: featuresPropsSchema,
  benefits: benefitsPropsSchema,
  pricing: pricingPropsSchema,
  testimonials: testimonialsPropsSchema,
  faq: faqPropsSchema,
  gallery: galleryPropsSchema,
  productGrid: productGridPropsSchema,
  blogGrid: blogGridPropsSchema,
  contact: contactPropsSchema,
  newsletter: newsletterPropsSchema,
  footer: footerPropsSchema,
  cta: ctaPropsSchema,
  stats: statsPropsSchema,
  logoCloud: logoCloudPropsSchema,
  team: teamPropsSchema,
  timeline: timelinePropsSchema,
  comparisonTable: comparisonTablePropsSchema,
  menu: menuPropsSchema,
  reservation: reservationPropsSchema,
  locationHours: locationHoursPropsSchema,
  about: aboutPropsSchema,
} as const;

export const componentTypes = Object.keys(sectionPropsByType) as Array<
  keyof typeof sectionPropsByType
>;

export const sectionSchema = z
  .object({
    id: z.string().min(1).max(60),
    type: z.enum(componentTypes as [string, ...string[]]),
    props: z.record(z.string(), z.unknown()),
  })
  .superRefine((section, ctx) => {
    const propsSchema = sectionPropsByType[section.type as keyof typeof sectionPropsByType];
    const result = propsSchema.safeParse(section.props);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `section "${section.id}" (${section.type}): ${issue.path.join(".")} ${issue.message}`,
          path: ["props", ...issue.path],
        });
      }
    }
  });

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  surfaceColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  inkColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  fontHeading: z.string().min(1).max(60),
  fontBody: z.string().min(1).max(60),
  radius: z.enum(["none", "sm", "md", "lg", "xl"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
});

export const seoSchema = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(200),
  keywords: z.array(z.string().max(40)).max(15),
  ogImage: z.string().max(500).optional(),
});

export const pageSchema = z.object({
  id: z.string().min(1).max(60),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  name: z.string().min(1).max(80),
  seo: seoSchema,
  sections: z.array(sectionSchema).min(1).max(30),
});

export const websiteMetaSchema = z.object({
  siteName: z.string().min(1).max(100),
  tagline: z.string().min(1).max(200),
  websiteType: z.string().min(1).max(60),
  industry: z.string().min(1).max(80),
  targetAudience: z.string().min(1).max(300),
  brandPersonality: z.array(z.string().max(40)).min(1).max(8),
  ctaStrategy: z.string().min(1).max(300),
  language: z.enum(["ar", "en"]),
  direction: z.enum(["ltr", "rtl"]),
  whatsapp: z.string().max(40).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  address: z.string().max(300).optional(),
});

export const assetSchema = z.object({
  id: z.string().min(1).max(60),
  url: z.string().min(1).max(500),
  alt: z.string().min(1).max(200),
});

export const websiteSpecSchema = z.object({
  meta: websiteMetaSchema,
  theme: themeSchema,
  nav: z.array(navLinkSchema).max(10),
  pages: z.array(pageSchema).min(1).max(12),
  assets: z.array(assetSchema).max(50),
});

export type ValidatedWebsiteSpec = z.infer<typeof websiteSpecSchema>;

export function validateWebsiteSpec(data: unknown) {
  return websiteSpecSchema.safeParse(data);
}
