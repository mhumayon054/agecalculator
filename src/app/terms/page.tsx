import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container py-8 prose prose-neutral max-w-none">
          <h1>Terms & Conditions</h1>
          <p>By using this site, you agree to these terms.</p>
          <h2>Usage</h2>
          <p>Calculators are provided "as-is" for informational purposes. Verify critical results independently.</p>
          <h2>Liability</h2>
          <p>We are not liable for decisions made based on calculator outputs.</p>
          <h2>Accuracy</h2>
          <p>We strive for accuracy, but formulas may vary by context. Please review assumptions.</p>
          <h2>Contact</h2>
          <p>For questions, use the Contact page.</p>
        </section>
      </main>
      <Footer totalCalculators={0} className="mt-8" />
    </div>
  );
}