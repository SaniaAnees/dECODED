import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "dECODED — a coding agent that spends fewer tokens",
  description:
    "Coding agents waste tokens. We're building one that doesn't. This season: a local prefix cache and normalizer. Next: the harness.",
  openGraph: {
    title: "dECODED — a coding agent that spends fewer tokens",
    description:
      "This season: a local prefix cache and normalizer. Next: a coding harness designed around that.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col text-mist">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WKCBEQGG07"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WKCBEQGG07');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
