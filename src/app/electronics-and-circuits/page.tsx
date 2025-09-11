import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ElectronicsCalculators from "@/components/calculators/ElectronicsCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Electronics & Circuits | Free Online Tools",
  description:
    "Ohm's law, voltage drop, resistor color codes, power and energy.",
  alternates: { canonical: "/electronics-and-circuits" },
  openGraph: {
    title: "Electronics & Circuits | Free Online Tools",
    description:
      "Ohm's law, voltage drop, resistor color codes, power and energy.",
    url: "/electronics-and-circuits",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electronics & Circuits",
    description:
      "Ohm's law, voltage drop, resistor color codes, power and energy.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Electronics & Circuits" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Electronics & Circuits</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ohm's law, voltage drop, resistor color codes, power and energy.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <ElectronicsCalculators />
        </section>
      </main>
      <Footer totalCalculators={4} className="mt-8" />
    </div>
  );
}