import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DateTimeCalculators from "@/components/calculators/DateTimeCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Date & Time Suite | Free Online Tools",
  description:
    "Age, date math, time differences, time cards, time zones, and more.",
  alternates: { canonical: "/date-and-time" },
  openGraph: {
    title: "Date & Time Suite | Free Online Tools",
    description:
      "Age, date math, time differences, time cards, time zones, and more.",
    url: "/date-and-time",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Date & Time Suite",
    description:
      "Age, date math, time differences, time cards, time zones, and more.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs
            className="mb-4"
            items={[{ label: "Home", href: "/" }, { label: "Date & Time Suite" }]}
          />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Date & Time Suite</h1>
            <p className="mt-1 text-sm text-muted-foreground">Age, date math, time differences, time cards, time zones, and more.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <DateTimeCalculators />
        </section>
      </main>
      <Footer totalCalculators={9} className="mt-8" />
    </div>
  );
}