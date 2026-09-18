import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  image?: string;
  tags?: string[];
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuProps {
  heading?: string;
  subheading?: string;
  categories: MenuCategory[];
}

export default function Menu({ heading, subheading, categories }: MenuProps) {
  return (
    <section id="menu" aria-label={heading ?? "Menu"} className="py-16 sm:py-20">
      <Container>
        {heading && <SectionHeading heading={heading} subheading={subheading} align="center" />}
        <div className="space-y-12">
          {categories.map((cat, ci) => (
            <div key={ci}>
              <h3 className="mb-5 font-heading text-xl font-bold text-ink">{cat.name}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex gap-4 rounded-site border border-ink/10 p-4">
                    {item.image !== undefined && (
                      <ImageBox url={item.image} alt={item.name} ratio="aspect-square" className="w-20 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-ink">{item.name}</p>
                        {item.price && <p className="whitespace-nowrap font-semibold text-accent">{item.price}</p>}
                      </div>
                      {item.description && <p className="mt-1 text-sm text-ink/70">{item.description}</p>}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((tag, ti) => (
                            <span key={ti} className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
