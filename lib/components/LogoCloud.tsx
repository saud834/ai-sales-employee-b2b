import { Container } from "@/lib/components/ui";

export interface LogoItem {
  name: string;
  image?: string;
}

export interface LogoCloudProps {
  heading?: string;
  logos: LogoItem[];
}

export default function LogoCloud({ heading, logos }: LogoCloudProps) {
  return (
    <section aria-label={heading ?? "Trusted by"} className="py-12">
      <Container>
        {heading && <p className="mb-6 text-center text-sm font-medium uppercase tracking-wide text-ink/50">{heading}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {logos.map((logo, i) =>
            logo.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={logo.image} alt={logo.name} className="h-8 w-auto grayscale" />
            ) : (
              <span key={i} className="font-heading text-lg font-bold text-ink/60">
                {logo.name}
              </span>
            )
          )}
        </div>
      </Container>
    </section>
  );
}
