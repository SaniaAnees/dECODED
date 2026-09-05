import type { Metadata } from "next";
import { MAIN_SITE_URL, SITE_NAME } from "@/lib/site";
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
  metadataBase: new URL(MAIN_SITE_URL),
  title: SITE_NAME,
  description: "Coding agents waste tokens. We're building one that doesn't.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: SITE_NAME,
    description: "Coding agents waste tokens. We're building one that doesn't.",
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Coding agents waste tokens. We're building one that doesn't.",
    images: ["/opengraph-image.png"],
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
