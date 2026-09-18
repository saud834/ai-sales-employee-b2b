"use client";

import { useState } from "react";
import { Container, SectionHeading } from "@/lib/components/ui";

export interface ReservationProps {
  heading: string;
  description?: string;
  whatsapp?: string;
  phone?: string;
}

export default function Reservation({ heading, description, whatsapp, phone }: ReservationProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");

  const message = encodeURIComponent(
    `Hello, I'd like to reserve a table.\nName: ${name || "-"}\nDate: ${date || "-"}\nTime: ${time || "-"}\nGuests: ${guests}`
  );
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${message}` : undefined;

  return (
    <section id="reservation" aria-label={heading} className="bg-primary/5 py-16 sm:py-20">
      <Container className="max-w-2xl">
        <SectionHeading heading={heading} subheading={description} align="center" />
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (waHref) window.open(waHref, "_blank", "noopener,noreferrer");
          }}
        >
          <div className="sm:col-span-2">
            <label htmlFor="res-name" className="mb-1 block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="res-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label htmlFor="res-date" className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <input
              id="res-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label htmlFor="res-time" className="mb-1 block text-sm font-medium text-ink">
              Time
            </label>
            <input
              id="res-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="res-guests" className="mb-1 block text-sm font-medium text-ink">
              Guests
            </label>
            <input
              id="res-guests"
              type="number"
              min={1}
              max={30}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-site border border-ink/20 bg-surface px-3 py-2 text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={!waHref}
            className="sm:col-span-2 rounded-site bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {waHref ? "Send via WhatsApp" : "Add a WhatsApp number to enable booking"}
          </button>
          {phone && <p className="sm:col-span-2 text-center text-sm text-ink/60">Or call us at {phone}</p>}
        </form>
      </Container>
    </section>
  );
}
