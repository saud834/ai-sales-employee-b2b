import { Container, SectionHeading, ImageBox } from "@/lib/components/ui";

export interface TeamMember {
  name: string;
  role?: string;
  photo?: string;
  bio?: string;
}

export interface TeamProps {
  heading: string;
  members: TeamMember[];
}

export default function Team({ heading, members }: TeamProps) {
  return (
    <section aria-label={heading} className="py-16 sm:py-20">
      <Container>
        <SectionHeading heading={heading} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, i) => (
            <div key={i} className="text-center">
              <ImageBox url={member.photo} alt={member.name} ratio="aspect-square" />
              <h3 className="mt-3 font-semibold text-ink">{member.name}</h3>
              {member.role && <p className="text-sm text-ink/60">{member.role}</p>}
              {member.bio && <p className="mt-1 text-xs text-ink/50">{member.bio}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
