import type { MetadataRoute } from "next";
import { PROD_URLS } from "@/lib/site";

/** Public, indexable routes. `/sign-in` and `/welcome` are intentionally absent. */
const ROUTES = [
  "/",
  "/about",
  "/pricing",
  "/privacy",
  "/terms",
  "/refund",
  "/feedback",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = PROD_URLS.main;
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
