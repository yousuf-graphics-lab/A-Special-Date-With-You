import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: "For Samee",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F0",
    theme_color: "#722F43",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
