import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import TransportationCalculators from "@/components/calculators/TransportationCalculators";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transportation | Free Online Tools",
  description:
    "Fuel cost, gas mileage, horsepower, engine HP, mileage reimbursement, and tire size.",
  alternates: { canonical: "/transportation" },
  openGraph: {
    title: "Transportation | Free Online Tools",
    description:
      "Fuel cost, gas mileage, horsepower, engine HP, mileage reimbursement, and tire size.",
    url: "/transportation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transportation",
    description:
      "Fuel cost, gas mileage, horsepower, engine HP, mileage reimbursement, and tire size.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Transportation" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Transportation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fuel cost, gas mileage, horsepower, engine HP, mileage reimbursement, and tire size.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <TransportationCalculators />
        </section>
      </main>
      <Footer totalCalculators={6} className="mt-8" />
    </div>
  );
}