"use client";

import { useState } from "react";
import { Container, SectionHeading } from "@/lib/components/ui";

export interface ContactProps {
  heading: string;
  description?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  showForm?: boolean;
}

export default function Contact({
  heading,
  description,
  phone,
  email,
  whatsapp,
  address,
  showForm = true,
}: ContactProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" aria-label={heading} className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionHeading heading={heading} subheading={description} align="center" />
        <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm">
          {phone && (
            <a href={`tel:${phone}`} className="rounded-site border border-ink/10 px-4 py-2 text-ink hover:bg-ink/5">
              &#128222; {phone}
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              className="rounded-site border border-ink/10 px-4 py-2 text-ink hover:bg-ink/5"
            >
              &#128172; WhatsApp
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="rounded-site border border-ink/10 px-4 py-2 text-ink hover:bg-ink/5">
              &#9993; {email}
            </a>
          )}
          {address && <span className="rounded-site border border-ink/10 px-4 py-2 text-ink/70">&#128205; {address}</span>}
        </div>
        {showForm &&
          (submitted ? (
            <p role="status" className="rounded-site bg-accent/10 p-4 text-center text-sm text-ink">
              Thanks! Your message has been received. We will get back to you shortly.
            </p>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-ink">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    required
                    className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-site bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Send Message
              </button>
            </form>
          ))}
      </Container>
    </section>
  );
}
