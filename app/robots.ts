import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/watch/", "/settings", "/watch-history"],
      },
    ],
    // Derived from the same source as `metadataBase` so the two can never drift
    // apart again.
    sitemap: `${site.url}/sitemap.xml`,
  }
}
