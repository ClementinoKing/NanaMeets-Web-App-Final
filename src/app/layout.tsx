import type { Metadata } from "next";
import type { Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NanaMeets",
  applicationName: "NanaMeets",
  description: "NanaMeets web platform for shared profiles, messages, and inbox management.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Fav-Icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-7322140828117790"
        />
        <meta name="theme-color" content="#0b0b0b" />
        <meta name="application-name" content="NanaMeets" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NanaMeets" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
