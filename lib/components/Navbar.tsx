"use client";

import { useState } from "react";
import { Container, Btn } from "@/lib/components/ui";
import type { CTAButton, NavLink } from "@/lib/types";

export interface NavbarProps {
  logoText: string;
  links: NavLink[];
  cta?: CTAButton;
  sticky?: boolean;
}

export default function Navbar({ logoText, links, cta, sticky }: NavbarProps) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className={`z-40 border-b border-ink/10 bg-surface/90 backdrop-blur ${sticky ? "sticky top-0" : ""}`}
    >
      <Container className="flex h-16 items-center justify-between">
        <a href="#home" className="font-heading text-lg font-bold text-ink">
          {logoText}
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href + link.label} href={link.href} className="text-sm text-ink/80 hover:text-ink">
              {link.label}
            </a>
          ))}
          {cta && <Btn cta={cta} />}
        </nav>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-site text-ink md:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </Container>
      {open && (
        <nav aria-label="Mobile" className="border-t border-ink/10 bg-surface md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                className="rounded-site px-2 py-2 text-sm text-ink/80 hover:bg-ink/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {cta && <Btn cta={cta} className="mt-2 w-full" />}
          </Container>
        </nav>
      )}
    </header>
  );
}
