import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header calculators={[]} />
      <main className="pt-16">
        <section className="container py-8 prose prose-neutral max-w-none">
          <h1>Privacy Policy</h1>
          <p>We respect your privacy. This policy explains what data we collect and how we use it.</p>
          <h2>Data Collected</h2>
          <ul>
            <li>Anonymous usage analytics to improve the product</li>
            <li>Form submissions when you contact us</li>
          </ul>
          <h2>Cookies</h2>
          <p>We use cookies for essential functionality and analytics. Third parties like Google AdSense may also use cookies.</p>
          <h2>Third-Party Disclosures</h2>
          <p>We may show ads via Google AdSense; their policies apply. We do not sell personal data.</p>
          <h2>Data Protection</h2>
          <p>We apply industry-standard security practices and HTTPS. Do not submit sensitive information via forms.</p>
        </section>
      </main>
      <Footer totalCalculators={0} className="mt-8" />
    </div>
  );
}