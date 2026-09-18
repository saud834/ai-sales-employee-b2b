import { Container, ImageBox } from "@/lib/components/ui";

export interface AboutProps {
  heading: string;
  body: string;
  image?: string;
  stats?: { value: string; label: string }[];
}

export default function About({ heading, body, image, stats }: AboutProps) {
  return (
    <section id="about" aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-bold text-ink">{heading}</h2>
            <p className="mt-4 text-ink/70">{body}</p>
            {stats && stats.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-6">
                {stats.map((s, i) => (
                  <div key={i}>
                    <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-sm text-ink/60">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ImageBox url={image} alt={heading} />
        </div>
      </Container>
    </section>
  );
}
