import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import WeatherCalculators from "@/components/calculators/WeatherCalculators";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather | Free Online Tools",
  description:
    "Heat index, wind chill, and dew point with safety guidance and unit selection.",
  alternates: { canonical: "/weather" },
  openGraph: {
    title: "Weather | Free Online Tools",
    description:
      "Heat index, wind chill, and dew point with safety guidance and unit selection.",
    url: "/weather",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weather",
    description:
      "Heat index, wind chill, and dew point with safety guidance and unit selection.",
  },
};

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container w-full max-w-full py-6 sm:py-8">
          <Breadcrumbs className="mb-4" items={[{ label: "Home", href: "/" }, { label: "Weather" }]} />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Weather</h1>
            <p className="mt-1 text-sm text-muted-foreground">Heat index, wind chill, and dew point with safety guidance and unit selection.</p>
            <div id="adsense-slot" className="mt-4 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">AdSense Slot</div>
          </div>
          <WeatherCalculators />
        </section>
      </main>
      <Footer totalCalculators={3} className="mt-8" />
    </div>
  );
}