import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container py-8">
          <h1 className="text-3xl font-bold tracking-tight">About Us</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            All-in-One Calculators provides accurate, fast, and accessible tools across daily life, academics, engineering, finance, weather, and more. Our mission is to help you save time and make better decisions through clear inputs, validated results, and simple explanations.
          </p>
          <div id="adsense-slot" className="mt-6 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">AdSense Slot</div>
        </section>
      </main>
      <Footer totalCalculators={0} className="mt-8" />
    </div>
  );
}