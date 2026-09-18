"use client";

import { useState } from "react";
import type { AssetRecord } from "@/lib/repo/assets";

export default function AssetsPanel({
  projectId,
  initialAssets,
}: {
  projectId: string;
  initialAssets: AssetRecord[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("alt", file.name.replace(/\.[a-z0-9]+$/i, ""));
      const res = await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error);
      const asset: AssetRecord = await res.json();
      setAssets((prev) => [asset, ...prev]);
    } finally {
      setUploading(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="p-4">
      <p className="mb-1 text-sm font-semibold text-slate-900">Asset library</p>
      <p className="mb-3 text-xs text-slate-400">
        Upload a photo, then paste its URL into an image field in the Edit tab (e.g. the hero image).
      </p>
      <label className="mb-4 block cursor-pointer rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 hover:border-slate-300">
        {uploading ? "Uploading..." : "Click to upload an image"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {assets.map((asset) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={asset.id} className="overflow-hidden rounded-lg border border-slate-200">
            <img src={asset.url} alt={asset.alt} className="aspect-square w-full object-cover" />
            <button
              onClick={() => copyUrl(asset.url)}
              className="w-full bg-slate-50 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {copied === asset.url ? "Copied!" : "Copy URL"}
            </button>
          </div>
        ))}
      </div>
      {assets.length === 0 && <p className="text-center text-xs text-slate-400">No images uploaded yet.</p>}
    </div>
  );
}
