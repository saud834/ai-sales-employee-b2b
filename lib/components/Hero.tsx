import { Container, Btn, ImageBox } from "@/lib/components/ui";
import type { CTAButton } from "@/lib/types";

export interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  image?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  alignment?: "left" | "center";
}

export default function Hero({
  eyebrow,
  headline,
  subheadline,
  image,
  primaryCta,
  secondaryCta,
  alignment = "left",
}: HeroProps) {
  const centered = alignment === "center";
  return (
    <section id="home" aria-label="Introduction" className="py-16 sm:py-24">
      <Container>
        <div className={`grid gap-10 ${centered ? "" : "md:grid-cols-2 md:items-center"}`}>
          <div className={centered ? "mx-auto max-w-2xl text-center" : ""}>
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
            )}
            <h1 className="font-heading text-4xl font-bold leading-tight text-ink sm:text-5xl">
              {headline}
            </h1>
            {subheadline && <p className="mt-5 text-lg text-ink/70">{subheadline}</p>}
            {(primaryCta || secondaryCta) && (
              <div className={`mt-8 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
                <Btn cta={primaryCta} />
                <Btn cta={secondaryCta} />
              </div>
            )}
          </div>
          {!centered && <ImageBox url={image} alt={headline} ratio="aspect-[5/4]" />}
        </div>
      </Container>
    </section>
  );
}
