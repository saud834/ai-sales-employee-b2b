import { Container } from "@/lib/components/ui";
import type { NavLink } from "@/lib/types";

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface FooterProps {
  columns: FooterColumn[];
  socialLinks?: SocialLink[];
  copyrightText: string;
}

export default function Footer({ columns, socialLinks = [], copyrightText }: FooterProps) {
  return (
    <footer className="border-t border-ink/10 bg-surface py-12 text-sm">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {columns.map((col, i) => (
            <div key={i}>
              <h3 className="font-heading font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link, li) => (
                  <li key={li}>
                    <a href={link.href} className="text-ink/70 hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-6 sm:flex-row">
          <p className="text-ink/60">{copyrightText}</p>
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((s, i) => (
                <a key={i} href={s.href} className="text-ink/60 hover:text-ink" aria-label={s.platform}>
                  {s.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}
