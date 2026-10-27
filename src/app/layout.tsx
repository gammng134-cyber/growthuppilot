import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";
import { siteUrl } from "@/lib/utils";

import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "GrowthPilot — five agents run your growth for you",
    template: "%s · GrowthPilot",
  },
  description:
    "Five AI agents run founder-led growth: they draft and send personalized cold email through your Gmail, chase the follow-ups, score your leads and publish the SEO articles that bring buyers in.",
  openGraph: {
    title: "GrowthPilot — five agents run your growth for you",
    description:
      "AI agents that draft and send personalized cold email through your Gmail, chase the follow-ups and publish the SEO articles that bring buyers to you.",
    type: "website",
    url: siteUrl(),
    siteName: "GrowthPilot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={schibsted.variable}>
      <body className="min-h-screen bg-ground font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
