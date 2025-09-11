import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementCalculators from "@/components/calculators/MeasurementCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Measurements & Units | Free Online Tools",
  description:
    "Unit conversions, height, GDP, density, mass/weight, speed, molarity, molecular weight, and Roman numerals.",
  alternates: { canonical: "/measurements-and-units" },
  openGraph: {
    title: "Measurements & Units | Free Online Tools",
    description:
      "Unit conversions, height, GDP, density, mass/weight, speed, molarity, molecular weight, and Roman numerals.",
    url: "/measurements-and-units",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Measurements & Units",
    description:
      "Unit conversions, height, GDP, density, mass/weight, speed, molarity, molecular weight, and Roman numerals.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Measurements & Units" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Measurements & Units</h1>
            <p className="mt-1 text-sm text-muted-foreground">Unit conversions, height, GDP, density, mass/weight, speed, molarity, molecular weight, and Roman numerals.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <MeasurementCalculators />
        </section>
      </main>
      <Footer totalCalculators={10} className="mt-8" />
    </div>
  );
}