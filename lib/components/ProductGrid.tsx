import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";

export interface ProductItem {
  name: string;
  price?: string;
  image?: string;
  description?: string;
  href?: string;
}

export interface ProductGridProps {
  heading: string;
  items: ProductItem[];
}

export default function ProductGrid({ heading, items }: ProductGridProps) {
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href ?? "#"}
              className="group rounded-site border border-ink/10 bg-surface p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ImageBox url={item.image} alt={item.name} />
              <h3 className="mt-3 font-semibold text-ink group-hover:underline">{item.name}</h3>
              {item.description && <p className="mt-1 text-sm text-ink/60">{item.description}</p>}
              {item.price && <p className="mt-2 font-bold text-ink">{item.price}</p>}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
