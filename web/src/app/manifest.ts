import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Coding agents waste tokens. We're building one that doesn't.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1228",
    theme_color: "#0A1228",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
