import type { Metadata } from "next";
import { Provider } from "@/components/Provider";
import { Header } from "@/components/Header";
import { Footer, Notice } from "@/components/ui";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "HAWA · Breathe smarter through smog season",
    template: "%s · HAWA",
  },
  description:
    "A family and community air-quality assistant with personalized routines, indoor guidance and transparent impact calculations.",
  icons: { icon: "/favicon.svg" },
  metadataBase: new URL(
    "https://hawa-air-assistant.vabjashwanthreddy.chatgpt.site",
  ),
  openGraph: {
    title: "HAWA · Clean-air choices for families and communities",
    description:
      "Source-linked routines and transparent impact comparisons for winter smog.",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "HAWA — Breathe smarter through smog season",
      },
    ],
    type: "website",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Header />
          <main id="main" tabIndex={-1}>
            <Notice />
            {children}
          </main>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}
