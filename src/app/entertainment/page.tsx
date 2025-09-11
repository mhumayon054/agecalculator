import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EntertainmentCalculators from "@/components/calculators/EntertainmentCalculators";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entertainment | Free Online Tools",
  description:
    "Dice roller with stats and a lighthearted love calculator.",
  alternates: { canonical: "/entertainment" },
  openGraph: {
    title: "Entertainment | Free Online Tools",
    description:
      "Dice roller with stats and a lighthearted love calculator.",
    url: "/entertainment",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Entertainment",
    description:
      "Dice roller with stats and a lighthearted love calculator.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Entertainment" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Entertainment</h1>
            <p className="mt-1 text-sm text-muted-foreground">Dice roller with stats and a lighthearted love calculator.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <EntertainmentCalculators />
        </section>
      </main>
      <Footer totalCalculators={2} className="mt-8" />
    </div>
  );
}