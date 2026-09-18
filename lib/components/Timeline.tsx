import { Container, SectionHeading } from "@/lib/components/ui";

export interface TimelineItem {
  date: string;
  title: string;
  description?: string;
}

export interface TimelineProps {
  heading?: string;
  items: TimelineItem[];
}

export default function Timeline({ heading, items }: TimelineProps) {
  return (
    <section aria-label={heading ?? "Timeline"} className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        {heading && <SectionHeading heading={heading} align="center" />}
        <ol className="relative border-s border-ink/15 ps-6">
          {items.map((item, i) => (
            <li key={i} className="mb-8 last:mb-0">
              <span className="absolute -start-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-accent" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.date}</p>
              <h3 className="mt-1 font-heading font-semibold text-ink">{item.title}</h3>
              {item.description && <p className="mt-1 text-sm text-ink/70">{item.description}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
