import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sales Employee",
  description: "AI-powered B2B sales employee: find leads and generate demo websites for prospects",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">
                A
              </span>
              AI Sales Employee
            </Link>
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/leads" className="hover:text-slate-900">
                Leads
              </Link>
              <Link href="/projects" className="hover:text-slate-900">
                Projects
              </Link>
              <Link
                href="/projects/new"
                className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
              >
                New Website
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
