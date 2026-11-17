import type { NextConfig } from "next";

const securityHeaders = [
  // Hosted previews embed the app in a frame on *.e2b.app / *.arena.ai, so
  // frame-ancestors is used instead of the all-or-nothing X-Frame-Options.
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'self' https://*.e2b.app https://*.arena.ai https://*.vercel.app;",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Embedded Postgres (local development) talks to the filesystem, so it must
  // stay a real node module instead of being bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // The private experience and the dashboard must never be indexed.
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
