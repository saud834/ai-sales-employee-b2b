import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/story-bible", label: "Story Bible" },
  { href: "/admin/content", label: "Content Planner" },
  { href: "/admin/opportunities", label: "Opportunities" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin" className="font-semibold">
            $0 → $1B <span className="text-neutral-500">/ internal</span>
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-400">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
