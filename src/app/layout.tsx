import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { siteUrl } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "GrowthPilot — your AI marketing team",
    template: "%s · GrowthPilot",
  },
  description:
    "AI agents that find your buyers, draft the outreach and rank you on Google. You approve every send.",
  openGraph: {
    title: "GrowthPilot — your AI marketing team",
    description:
      "AI agents that find your buyers, draft the outreach and rank you on Google. You approve every send.",
    type: "website",
    url: siteUrl(),
    siteName: "GrowthPilot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
