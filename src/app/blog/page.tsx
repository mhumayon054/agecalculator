import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const posts = [
  {
    slug: "how-to-calculate-age-accurately",
    title: "How to Calculate Age Accurately: Beyond Basic Years",
    excerpt:
      "Learn precise age calculation methods including leap years, months, and day-level accuracy.",
    category: "Date & Time",
  },
  {
    slug: "understanding-time-zones",
    title: "Understanding Time Zones: A Complete Guide for Travelers",
    excerpt:
      "A practical overview of UTC, offsets, and daylight saving time for planning across time zones.",
    category: "Date & Time",
  },
];

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
            <p className="mt-2 text-muted-foreground">Guides and insights related to our calculator categories.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article 
                key={p.slug} 
                className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-3 inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {p.category}
                  </div>
                  <h2 className="text-xl font-semibold leading-tight">
                    <Link href={`/blog/${p.slug}`} className="text-foreground hover:text-primary transition-colors duration-200">
                      {p.title}
                      <span className="absolute inset-0" aria-hidden="true" />
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.excerpt}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary">
                    Read more
                    <svg
                      className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-12 text-center">
            <p className="text-sm text-muted-foreground">Advertisement</p>
          </div>
        </section>
      </main>
      <Footer totalCalculators={0} className="mt-8" />
    </div>
  );
}