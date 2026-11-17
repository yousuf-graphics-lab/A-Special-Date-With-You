import type { Metadata, Viewport } from "next";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/inter";
import "@fontsource/great-vibes/400.css";
import "./globals.css";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: {
    default: SITE.title,
    template: `%s · ${SITE.title}`,
  },
  description: SITE.description,
  applicationName: SITE.title,
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  // This is a private letter, not a website to be discovered.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
    locale: "en_BD",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-dvh bg-ivory text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-burgundy focus:px-5 focus:py-3 focus:text-sm focus:text-ivory"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
