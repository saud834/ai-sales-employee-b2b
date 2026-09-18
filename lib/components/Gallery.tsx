import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface GalleryProps {
  heading?: string;
  images: GalleryImage[];
}

export default function Gallery({ heading, images }: GalleryProps) {
  return (
    <section id="gallery" aria-label={heading ?? "Gallery"} className="py-16 sm:py-20">
      <Container>
        {heading && <SectionHeading heading={heading} align="center" />}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <figure key={i}>
              <ImageBox url={img.url} alt={img.alt} ratio="aspect-square" />
              {img.caption && <figcaption className="mt-1 text-xs text-ink/60">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
