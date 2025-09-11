import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

export const metadata: Metadata = {
  title: "All-in-One Calculators | Free Online Tools",
  description:
    "Accurate, fast, and accessible calculators across date & time, housing, measurements, electronics, internet, utilities, weather, transportation, and entertainment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "All-in-One Calculators | Free Online Tools",
    description:
      "Accurate, fast, and accessible calculators across many categories.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All-in-One Calculators",
    description:
      "Accurate, fast, and accessible calculators across many categories.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        {/* Visual Edits Messenger (kept) */}
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />

        {/* GA4 (conditionally injected when NEXT_PUBLIC_GA_ID is set) */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        ) : null}

        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}