import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";
import type { FeatureItem } from "@/lib/components/Features";

export interface BenefitsProps {
  heading: string;
  subheading?: string;
  items: FeatureItem[];
  image?: string;
  imagePosition?: "left" | "right";
}

export default function Benefits({ heading, subheading, items, image, imagePosition = "right" }: BenefitsProps) {
  const imageFirst = imagePosition === "left";
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          {imageFirst && <ImageBox url={image} alt={heading} />}
          <div>
            <SectionHeading heading={heading} subheading={subheading} />
            <ul className="space-y-4">
              {items.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 text-accent" aria-hidden="true">
                    &#10003;
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-ink/70">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {!imageFirst && <ImageBox url={image} alt={heading} />}
        </div>
      </Container>
    </section>
  );
}
