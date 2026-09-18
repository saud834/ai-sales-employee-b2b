"use client";

import { useEffect, useState } from "react";
import SiteRenderer from "@/lib/components/SiteRenderer";
import type { PageSpec, WebsiteSpec } from "@/lib/types";

function pathForSlug(slug: string): string {
  return slug === "home" ? "/" : `/${slug}`;
}

/** Renders one page of a WebsiteSpec inside the /preview route. Internal
 * links (nav items pointing at another page, e.g. a language switcher or
 * "/about") only resolve as real Next.js routes in the *exported* standalone
 * project. Inside this tool's own preview iframe there is no such route, so
 * this component intercepts clicks on those links and reloads the iframe at
 * the right ?page= slug instead — same link, correct behavior in both
 * places. In-page anchors (#menu), tel:, mailto:, and external links are
 * left alone. */
export default function PreviewFrame({
  spec,
  page,
  projectId,
  editable = false,
}: {
  spec: WebsiteSpec;
  page: PageSpec;
  projectId: string;
  editable?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const slugByPath = new Map(spec.pages.map((p) => [pathForSlug(p.slug), p.slug]));

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      const slug = slugByPath.get(href);
      if (!slug) return;
      e.preventDefault();
      const query = new URLSearchParams({ page: slug });
      if (editable) query.set("edit", "1");
      window.location.href = `/preview/${projectId}?${query.toString()}`;
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [spec.pages, projectId, editable]);

  return (
    <SiteRenderer
      spec={spec}
      page={page}
      editable={editable}
      selectedSectionId={selected}
      onSelectSection={
        editable
          ? (id) => {
              setSelected(id);
              window.parent.postMessage({ type: "select-section", sectionId: id }, window.location.origin);
            }
          : undefined
      }
    />
  );
}
