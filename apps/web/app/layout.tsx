import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "VideoKit — Branded Video Hosting for SaaS",
    template: "%s | VideoKit",
  },
  description: "Branded video hosting for indie SaaS. Wistia-like features at $9/mo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
