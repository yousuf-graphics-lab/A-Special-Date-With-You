import type { MetadataRoute } from "next";

/**
 * This is a private love letter, not a public page. Keep every crawler out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
