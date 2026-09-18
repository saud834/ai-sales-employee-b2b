import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";

export interface BlogPostItem {
  title: string;
  excerpt?: string;
  image?: string;
  date?: string;
  href?: string;
}

export interface BlogGridProps {
  heading: string;
  posts: BlogPostItem[];
}

export default function BlogGrid({ heading, posts }: BlogGridProps) {
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.href ?? "#"}
              className="group rounded-site border border-ink/10 bg-surface p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ImageBox url={post.image} alt={post.title} ratio="aspect-[16/9]" />
              {post.date && <p className="mt-3 text-xs uppercase tracking-wide text-ink/50">{post.date}</p>}
              <h3 className="mt-1 font-heading text-lg font-semibold text-ink group-hover:underline">
                {post.title}
              </h3>
              {post.excerpt && <p className="mt-2 text-sm text-ink/70">{post.excerpt}</p>}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
