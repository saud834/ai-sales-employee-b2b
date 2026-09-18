"use client";

import { useState } from "react";
import { Container } from "@/lib/components/ui";
import { t, type Lang } from "@/lib/components/i18n";

export interface NewsletterProps {
  heading: string;
  subheading?: string;
  placeholder?: string;
  lang?: Lang;
}

export default function Newsletter({ heading, subheading, placeholder = "you@email.com", lang }: NewsletterProps) {
  const [done, setDone] = useState(false);
  return (
    <section aria-label={heading} className="bg-primary/5 py-14">
      <Container className="max-w-xl text-center">
        <h2 className="font-heading text-2xl font-bold text-ink">{heading}</h2>
        {subheading && <p className="mt-2 text-sm text-ink/70">{subheading}</p>}
        {done ? (
          <p role="status" className="mt-5 text-sm font-medium text-ink">
            {t(lang, "subscribed")}
          </p>
        ) : (
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder={placeholder}
              className="w-full flex-1 rounded-site border border-ink/20 bg-surface px-4 py-3 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
            <button
              type="submit"
              className="rounded-site bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {t(lang, "subscribe")}
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
