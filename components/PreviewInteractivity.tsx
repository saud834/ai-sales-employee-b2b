"use client";

import { useState } from "react";
import SiteRenderer from "@/lib/components/SiteRenderer";
import type { PageSpec, WebsiteSpec } from "@/lib/types";

export default function PreviewInteractivity({ spec, page }: { spec: WebsiteSpec; page: PageSpec }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SiteRenderer
      spec={spec}
      page={page}
      editable
      selectedSectionId={selected}
      onSelectSection={(id) => {
        setSelected(id);
        window.parent.postMessage({ type: "select-section", sectionId: id }, window.location.origin);
      }}
    />
  );
}
