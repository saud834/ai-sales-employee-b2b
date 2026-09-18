import { Container, SectionHeading } from "@/lib/components/ui";

export interface HoursEntry {
  day: string;
  hours: string;
}

export interface LocationHoursProps {
  heading?: string;
  address: string;
  mapEmbedUrl?: string;
  hours: HoursEntry[];
}

export default function LocationHours({ heading, address, mapEmbedUrl, hours }: LocationHoursProps) {
  return (
    <section id="location" aria-label={heading ?? "Location and hours"} className="py-16 sm:py-20">
      <Container>
        {heading && <SectionHeading heading={heading} align="center" />}
        <div className="grid gap-8 md:grid-cols-2">
          {mapEmbedUrl ? (
            <iframe
              title="Location map"
              src={mapEmbedUrl}
              className="aspect-[4/3] w-full rounded-site border-0"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-site bg-ink/5 text-sm text-ink/40">
              Map preview available once an address is confirmed
            </div>
          )}
          <div>
            <h3 className="font-heading font-semibold text-ink">Address</h3>
            <p className="mt-1 text-ink/70">{address}</p>
            <h3 className="mt-6 font-heading font-semibold text-ink">Hours</h3>
            <dl className="mt-2 space-y-1">
              {hours.map((h, i) => (
                <div key={i} className="flex justify-between border-b border-ink/10 py-1.5 text-sm">
                  <dt className="text-ink/70">{h.day}</dt>
                  <dd className="font-medium text-ink">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
