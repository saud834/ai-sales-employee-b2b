import { Container } from "@/lib/components/ui";

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsProps {
  heading?: string;
  items: StatItem[];
}

export default function Stats({ heading, items }: StatsProps) {
  return (
    <section aria-label={heading ?? "Statistics"} className="py-14">
      <Container>
        {heading && <h2 className="mb-8 text-center font-heading text-2xl font-bold text-ink">{heading}</h2>}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <p className="font-heading text-3xl font-bold text-primary sm:text-4xl">{item.value}</p>
              <p className="mt-1 text-sm text-ink/60">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
