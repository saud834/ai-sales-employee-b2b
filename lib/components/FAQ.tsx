import { Container, SectionHeading } from "@/lib/components/ui";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  heading: string;
  items: FAQItem[];
}

export default function FAQ({ heading, items }: FAQProps) {
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionHeading heading={heading} align="center" />
        <div className="divide-y divide-ink/10 rounded-site border border-ink/10">
          {items.map((item, i) => (
            <details key={i} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span aria-hidden="true" className="text-ink/40 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
