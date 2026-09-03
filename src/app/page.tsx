import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-sm uppercase tracking-widest text-neutral-500">
        Build in public
      </p>
      <h1 className="text-4xl font-semibold">$0 → $1,000,000,000</h1>
      <p className="text-neutral-400">
        A real company, documented through an AI-generated fictional
        founder, Ava Carter. Every claim of revenue, customers, or growth
        traces back to a logged, real event.
      </p>
      <Link
        href="/admin"
        className="mt-4 w-fit rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-300"
      >
        Open internal dashboard →
      </Link>
    </main>
  );
}
