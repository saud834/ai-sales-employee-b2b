import { Container, Btn } from "@/lib/components/ui";
import type { CTAButton } from "@/lib/types";

export interface CTAProps {
  heading: string;
  subheading?: string;
  primaryCta: CTAButton;
  secondaryCta?: CTAButton;
}

export default function CTA({ heading, subheading, primaryCta, secondaryCta }: CTAProps) {
  return (
    <section aria-label={heading} className="bg-primary py-16 text-white">
      <Container className="text-center">
        <h2 className="font-heading text-3xl font-bold sm:text-4xl">{heading}</h2>
        {subheading && <p className="mx-auto mt-3 max-w-xl text-white/85">{subheading}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={primaryCta.href}
            className="rounded-site bg-white px-6 py-3 text-sm font-semibold text-primary hover:opacity-90"
          >
            {primaryCta.label}
          </a>
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              className="rounded-site border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      </Container>
    </section>
  );
}
