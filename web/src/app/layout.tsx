import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dECODED — Prefix-Cached Proxy for AI Coding Agents",
  description:
    "Lossless Memory & Prefix-Cached Proxy for AI Coding Agents. 10x faster agents, 70% cheaper API bills, zero context loss.",
  openGraph: {
    title: "dECODED — Prefix-Cached Proxy for AI Coding Agents",
    description:
      "Stop agent context drift and maximize KV-cache hits with a 1-line setup.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
