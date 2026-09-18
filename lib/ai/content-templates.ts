import type { ComponentType, SectionSpec, WebsiteMeta } from "@/lib/types";
import { nanoid } from "nanoid";

export function sid(type: string): string {
  return `${type}-${nanoid(6)}`;
}

export function section(type: ComponentType, props: Record<string, unknown>): SectionSpec {
  return { id: sid(type), type, props };
}

export function navbarSection(meta: WebsiteMeta, links: { label: string; href: string }[]) {
  return section("navbar", {
    logoText: meta.siteName,
    links,
    cta: meta.whatsapp
      ? { label: "WhatsApp Us", href: `https://wa.me/${meta.whatsapp.replace(/[^0-9]/g, "")}`, style: "primary" }
      : { label: "Contact", href: "/contact", style: "primary" },
    sticky: true,
  });
}

export function footerSection(meta: WebsiteMeta, links: { label: string; href: string }[]) {
  return section("footer", {
    columns: [
      { title: meta.siteName, links },
      {
        title: "Contact",
        links: [
          meta.phone ? { label: meta.phone, href: `tel:${meta.phone}` } : null,
          meta.email ? { label: meta.email, href: `mailto:${meta.email}` } : null,
          meta.address ? { label: meta.address, href: "#" } : null,
        ].filter(Boolean) as { label: string; href: string }[],
      },
    ],
    socialLinks: meta.whatsapp
      ? [{ platform: "whatsapp", href: `https://wa.me/${meta.whatsapp.replace(/[^0-9]/g, "")}` }]
      : [],
    copyrightText: `© ${new Date().getFullYear()} ${meta.siteName}. All rights reserved.`,
  });
}
