"use client";

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const OPTIONS: { key: Device; label: string; icon: string }[] = [
  { key: "desktop", label: "Desktop", icon: "\u{1F5A5}" },
  { key: "tablet", label: "Tablet", icon: "\u{1F4F1}" },
  { key: "mobile", label: "Mobile", icon: "\u{1F4F3}" },
];

export default function DeviceToggle({ device, onChange }: { device: Device; onChange: (d: Device) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={device === opt.key}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            device === opt.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span aria-hidden="true">{opt.icon}</span> {opt.label}
        </button>
      ))}
    </div>
  );
}
