import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$0 -> $1B | Ava Carter",
  description:
    "Story Bible, Content Planner, and Startup Discovery Engine for the build-in-public project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
