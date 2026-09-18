import type { CTAButton } from "@/lib/types";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "left",
}: {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`mb-10 max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
      )}
      <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">{heading}</h2>
      {subheading && <p className="mt-3 text-base text-ink/70 sm:text-lg">{subheading}</p>}
    </div>
  );
}

export function Btn({ cta, className = "" }: { cta?: CTAButton; className?: string }) {
  if (!cta) return null;
  const base =
    "inline-flex items-center justify-center rounded-site px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const styles: Record<string, string> = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-transparent border border-ink/20 text-ink hover:bg-ink/5",
    ghost: "bg-transparent text-primary hover:underline",
  };
  return (
    <a href={cta.href} className={`${base} ${styles[cta.style ?? "primary"]} ${className}`}>
      {cta.label}
    </a>
  );
}

export function ImageBox({
  url,
  alt,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  url?: string;
  alt: string;
  className?: string;
  ratio?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={`${ratio} w-full rounded-site object-cover ${className}`} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`${ratio} w-full rounded-site bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 flex items-center justify-center ${className}`}
    >
      <span className="px-4 text-center text-sm text-ink/40">{alt}</span>
    </div>
  );
}

export function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
