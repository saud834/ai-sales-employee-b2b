import { Container, SectionHeading } from "@/lib/components/ui";

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

export interface FeaturesProps {
  heading: string;
  subheading?: string;
  items: FeatureItem[];
}

export default function Features({ heading, subheading, items }: FeaturesProps) {
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} subheading={subheading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-site border border-ink/10 bg-surface p-6">
              {item.icon && <div className="mb-3 text-2xl text-accent" aria-hidden="true">{item.icon}</div>}
              <h3 className="font-heading text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
