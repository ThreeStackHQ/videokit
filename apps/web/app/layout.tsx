import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VideoKit — Branded Video Hosting for SaaS",
    template: "%s | VideoKit",
  },
  description:
    "Host your demo video without YouTube ads. Branded video player with CTA overlays and email gates — $9/mo.",
  metadataBase: new URL("https://videokit.io"),
  openGraph: {
    type: "website",
    siteName: "VideoKit",
    title: "VideoKit — Branded Video Hosting for SaaS",
    description:
      "Host your demo video without YouTube ads. Branded video player with CTA overlays and email gates — $9/mo.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VideoKit — Branded Video Hosting for SaaS",
    description: "Wistia-level features at $9/mo for indie makers.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        {children}
      </body>
    </html>
  );
}
