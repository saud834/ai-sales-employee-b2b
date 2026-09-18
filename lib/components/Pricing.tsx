import { Container, SectionHeading, Btn } from "@/lib/components/ui";
import type { CTAButton } from "@/lib/types";

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta?: CTAButton;
  highlighted?: boolean;
}

export interface PricingProps {
  heading: string;
  subheading?: string;
  plans: PricingPlan[];
}

export default function Pricing({ heading, subheading, plans }: PricingProps) {
  return (
    <section id="pricing" aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} subheading={subheading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`flex flex-col rounded-site border p-6 ${
                plan.highlighted ? "border-primary bg-primary/5 shadow-lg" : "border-ink/10 bg-surface"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold text-ink">{plan.name}</h3>
              {plan.description && <p className="mt-1 text-sm text-ink/70">{plan.description}</p>}
              <p className="mt-4 text-3xl font-bold text-ink">
                {plan.price}
                {plan.period && <span className="text-base font-normal text-ink/60">{plan.period}</span>}
              </p>
              <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex gap-2 text-sm text-ink/80">
                    <span className="text-accent" aria-hidden="true">
                      &#10003;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Btn cta={plan.cta ?? { label: "Choose Plan", href: "#contact", style: plan.highlighted ? "primary" : "secondary" }} className="mt-6 w-full" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
