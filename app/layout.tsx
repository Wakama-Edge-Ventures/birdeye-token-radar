import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Birdeye Token Radar",
    template: "%s | Birdeye Token Radar",
  },
  description:
    "Real-time Solana token radar with trending movers, new listings, and overview-based safety scoring powered by Birdeye Data.",
  keywords: [
    "Birdeye",
    "Solana",
    "token dashboard",
    "crypto analytics",
    "token radar",
    "safety score",
  ],
  authors: [{ name: "Marouane Jebbar", url: "https://x.com/johncena" }],
  openGraph: {
    title: "Birdeye Token Radar",
    description:
      "Track trending Solana tokens, new listings, and overview-based risk signals with live Birdeye data.",
    siteName: "Birdeye Token Radar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Birdeye Token Radar",
    description:
      "Trending Solana tokens, new listings, and overview-based safety scoring powered by Birdeye Data.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
