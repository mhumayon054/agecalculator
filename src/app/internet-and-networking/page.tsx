import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InternetCalculators from "@/components/calculators/InternetCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internet & Networking | Free Online Tools",
  description:
    "IP subnet calculator, secure password generator, and bandwidth transfer time.",
  alternates: { canonical: "/internet-and-networking" },
  openGraph: {
    title: "Internet & Networking | Free Online Tools",
    description:
      "IP subnet calculator, secure password generator, and bandwidth transfer time.",
    url: "/internet-and-networking",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Internet & Networking",
    description:
      "IP subnet calculator, secure password generator, and bandwidth transfer time.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Internet & Networking" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Internet & Networking</h1>
            <p className="mt-1 text-sm text-muted-foreground">IP subnet calculator, secure password generator, and bandwidth transfer time.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <InternetCalculators />
        </section>
      </main>
      <Footer totalCalculators={3} className="mt-8" />
    </div>
  );
}