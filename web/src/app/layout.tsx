import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
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
  title: "dECODED",
  description: "Coding agents waste tokens. We're building one that doesn't.",
  openGraph: {
    title: "dECODED",
    description: "Coding agents waste tokens. We're building one that doesn't.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
