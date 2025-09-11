import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const routes = [
    "",
    "/date-and-time",
    "/housing-and-building",
    "/measurements-and-units",
    "/electronics-and-circuits",
    "/internet-and-networking",
    "/everyday-utilities",
    "/weather",
    "/transportation",
    "/entertainment",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/blog",
  ];

  const now = new Date();
  return routes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}