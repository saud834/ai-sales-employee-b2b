"use client";

import type { CSSProperties } from "react";
import type { PageSpec, WebsiteSpec } from "@/lib/types";
import { componentRegistry } from "@/lib/components/registry";

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "14px",
  xl: "22px",
};

const DENSITY_SCALE: Record<string, string> = {
  compact: "0.85",
  comfortable: "1",
  spacious: "1.15",
};

export function themeToCssVars(theme: WebsiteSpec["theme"]): CSSProperties {
  return {
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-accent": theme.accentColor,
    "--color-surface": theme.surfaceColor,
    "--color-ink": theme.inkColor,
    "--font-heading": `"${theme.fontHeading}", sans-serif`,
    "--font-body": `"${theme.fontBody}", sans-serif`,
    "--radius": RADIUS_MAP[theme.radius] ?? "8px",
    "--density": DENSITY_SCALE[theme.density] ?? "1",
    backgroundColor: theme.surfaceColor,
    color: theme.inkColor,
  } as CSSProperties;
}

export function googleFontsHref(theme: WebsiteSpec["theme"]): string {
  const families = Array.from(new Set([theme.fontHeading, theme.fontBody]))
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export interface SiteRendererProps {
  spec: WebsiteSpec;
  page: PageSpec;
  editable?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
}

export default function SiteRenderer({
  spec,
  page,
  editable = false,
  selectedSectionId,
  onSelectSection,
}: SiteRendererProps) {
  return (
    <div
      dir={page.direction ?? spec.meta.direction}
      lang={page.language ?? spec.meta.language}
      className="min-h-screen font-body"
      style={{ ...themeToCssVars(spec.theme), fontSize: `calc(1rem * var(--density))` }}
    >
      <link rel="stylesheet" href={googleFontsHref(spec.theme)} />
      <main>
        {page.sections.map((section) => {
          const Component = componentRegistry[section.type];
          if (!Component) return null;
          const isSelected = selectedSectionId === section.id;
          return (
            <div
              key={section.id}
              data-section-id={section.id}
              onClick={
                editable
                  ? (e) => {
                      e.stopPropagation();
                      onSelectSection?.(section.id);
                    }
                  : undefined
              }
              className={
                editable
                  ? `relative transition-shadow ${
                      isSelected
                        ? "shadow-[inset_0_0_0_2px_var(--color-accent)]"
                        : "hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.15)]"
                    } cursor-pointer`
                  : ""
              }
            >
              <Component {...section.props} lang={page.language ?? spec.meta.language} />
            </div>
          );
        })}
      </main>
    </div>
  );
}
