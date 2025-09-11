import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UtilityCalculators from "@/components/calculators/UtilityCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Everyday Utilities | Free Online Tools",
  description:
    "GPA, grade planning, bra size, shoe size, tip split, golf handicap, and sleep cycles.",
  alternates: { canonical: "/everyday-utilities" },
  openGraph: {
    title: "Everyday Utilities | Free Online Tools",
    description:
      "GPA, grade planning, bra size, shoe size, tip split, golf handicap, and sleep cycles.",
    url: "/everyday-utilities",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everyday Utilities",
    description:
      "GPA, grade planning, bra size, shoe size, tip split, golf handicap, and sleep cycles.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Everyday Utilities" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Everyday Utilities</h1>
            <p className="mt-1 text-sm text-muted-foreground">GPA, grade planning, bra size, shoe size, tip split, golf handicap, and sleep cycles.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <UtilityCalculators />
        </section>
      </main>
      <Footer totalCalculators={7} className="mt-8" />
    </div>
  );
}