import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HousingCalculators from "@/components/calculators/HousingCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Housing & Building | Free Online Tools",
  description:
    "Concrete, roofing, square footage, stairs, tile, mulch, gravel, and BTU.",
  alternates: { canonical: "/housing-and-building" },
  openGraph: {
    title: "Housing & Building | Free Online Tools",
    description:
      "Concrete, roofing, square footage, stairs, tile, mulch, gravel, and BTU.",
    url: "/housing-and-building",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Housing & Building",
    description:
      "Concrete, roofing, square footage, stairs, tile, mulch, gravel, and BTU.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Housing & Building" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Housing & Building</h1>
            <p className="mt-1 text-sm text-muted-foreground">Concrete, roofing, square footage, stairs, tile, mulch, gravel, and BTU.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <HousingCalculators />
        </section>
      </main>
      <Footer totalCalculators={8} className="mt-8" />
    </div>
  );
}