import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono, Roboto_Mono, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TypeFlow — Typing Practice & Speed Test",
  description:
    "A beautiful, local-first typing trainer. Time, words, quotes, real-world sentences, zen & custom modes, live charts, per-key heatmaps and 15 themes. No login required.",
  keywords: ["typing test", "typing speed", "wpm", "monkeytype", "typing practice", "keyboard"],
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#141210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="ember" className="dark">
      <body
        className={`${geistSans.variable} ${jetbrains.variable} ${robotoMono.variable} ${plexMono.variable} ${grotesk.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
