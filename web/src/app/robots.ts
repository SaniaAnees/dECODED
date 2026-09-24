import type { MetadataRoute } from "next";
import { PROD_URLS } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/sign-in", "/welcome"],
    },
    sitemap: `${PROD_URLS.main}/sitemap.xml`,
    host: PROD_URLS.main,
  };
}
