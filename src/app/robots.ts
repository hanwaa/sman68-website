import type { MetadataRoute } from "next";
import { siteBase } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = siteBase();
  return {
    rules: {
      userAgent: "*",
      // /api/og serves the Open Graph card, it must stay crawlable, otherwise
      // WhatsApp/Telegram refuse the preview image.
      allow: ["/", "/api/og"],
      disallow: ["/dashboard", "/login", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
