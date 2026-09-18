import { Container, SectionHeading, Stars } from "@/lib/components/ui";

export interface TestimonialItem {
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsProps {
  heading: string;
  items: TestimonialItem[];
}

export default function Testimonials({ heading, items }: TestimonialsProps) {
  return (
    <section id="reviews" aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <figure key={i} className="rounded-site border border-ink/10 bg-surface p-6">
              {item.rating && <Stars rating={item.rating} />}
              <blockquote className="mt-3 text-sm text-ink/80">&ldquo;{item.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-ink">
                {item.name}
                {item.role && <span className="font-normal text-ink/60"> &middot; {item.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
