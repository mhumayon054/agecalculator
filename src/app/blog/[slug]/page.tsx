import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

// Minimal in-file posts map; extend as needed
const POSTS: Record<string, {
  title: string;
  description: string;
  category: string;
  date: string; // ISO
  updated?: string; // ISO
  content: () => JSX.Element;
}> = {
  "how-to-calculate-age-accurately": {
    title: "How to Calculate Age Accurately: Beyond Basic Years",
    description:
      "Learn precise age calculation methods including leap years, months, and day-level accuracy.",
    category: "Date & Time",
    date: "2024-06-01",
    updated: "2024-10-01",
    content: () => (
      <div className="prose prose-neutral max-w-none">
        <p>
          Calculating age goes beyond subtracting birth year from the current year. Precise methods account
          for months, days, and leap years. This guide explains reliable approaches and common pitfalls.
        </p>
        <h2>Key Concepts</h2>
        <ul>
          <li>Use exact dates to compute years, months, and days.</li>
          <li>Account for leap years and different month lengths.</li>
          <li>Prefer ISO 8601 date formats (YYYY-MM-DD) to avoid confusion.</li>
        </ul>
        <h2>Recommended Tools</h2>
        <p>
          Try our
          {" "}
          <Link href="/date-and-time" className="text-primary hover:underline">Age Calculator</Link>
          {" "}
          for instant results with day-level precision, including next birthday and total days lived.
        </p>
        <h3>Example</h3>
        <p>
          For someone born on 1990-02-28 and today being 2025-09-10, compute differences year-by-year,
          then month/day, ensuring leap-day offsets are handled correctly.
        </p>
        <div id="adsense-slot" className="mt-6 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">AdSense Slot</div>
      </div>
    ),
  },
  "understanding-time-zones": {
    title: "Understanding Time Zones: A Complete Guide for Travelers",
    description:
      "A practical overview of UTC, offsets, and daylight saving time for planning across time zones.",
    category: "Date & Time",
    date: "2024-07-12",
    updated: "2024-10-01",
    content: () => (
      <div className="prose prose-neutral max-w-none">
        <p>
          Time zones are offsets from Coordinated Universal Time (UTC). Some regions observe daylight saving
          time, shifting clocks seasonally. Understanding offsets ensures accurate scheduling.
        </p>
        <h2>Core Ideas</h2>
        <ul>
          <li>UTC is the baseline for civil timekeeping.</li>
          <li>Offsets are typically expressed like UTC+02:00 or UTC-07:00.</li>
          <li>Daylight saving rules vary by country and change over time.</li>
        </ul>
        <h2>Plan with Confidence</h2>
        <p>
          Use our
          {" "}
          <Link href="/date-and-time" className="text-primary hover:underline">Time Zone Calculator</Link>
          {" "}
          to convert between cities and preview DST effects.
        </p>
        <div id="adsense-slot" className="mt-6 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">AdSense Slot</div>
      </div>
    ),
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = POSTS[params.slug];
  const title = post ? `${post.title} | Blog` : "Article | Blog";
  const description = post?.description ?? "Read our latest article.";
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const url = `${base}/blog/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <div className="min-h-dvh w-full bg-background text-foreground">
        <Header calculators={[]} />
        <main className="pt-16">
          <section className="container py-12">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Not found" }]} />
            <div className="mt-6 rounded-lg border border-border bg-card p-8">
              <h1 className="text-2xl font-semibold">Article not found</h1>
              <p className="mt-2 text-muted-foreground">The article you are looking for does not exist.</p>
              <div className="mt-4">
                <Link href="/blog" className="text-primary hover:underline">Go back to Blog</Link>
              </div>
            </div>
          </section>
        </main>
        <Footer totalCalculators={0} className="mt-8" />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: "All-in-One Calculators" },
    publisher: { "@type": "Organization", name: "All-in-One Calculators" },
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container py-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
          <article className="mt-4 rounded-lg border border-border bg-card p-6">
            <header>
              <div className="text-xs text-muted-foreground">{post.category} • {new Date(post.date).toLocaleDateString()}</div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{post.title}</h1>
              <p className="mt-2 text-muted-foreground">{post.description}</p>
            </header>
            <div className="mt-6">
              {post.content()}
            </div>
          </article>
          <div className="mt-8 text-sm text-muted-foreground">
            Looking for tools? Explore the <Link href="/date-and-time" className="text-primary hover:underline">Date & Time Suite</Link> or return to the <Link href="/" className="text-primary hover:underline">home page</Link>.
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </section>
      </main>
      <Footer totalCalculators={0} className="mt-8" />
    </div>
  );
}