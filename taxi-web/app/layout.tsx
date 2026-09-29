import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://tiranaride.al"),
  title: {
    default: "Tirana Taxi | Taxi Lux | Cheap taxi from Tirana to | Albania",
    template: "%s | Tirana Taxi",
  },
  description:
    "Rezervo taxi nga Tirana drejt Durresit, Rinasit, Vlores, Sarandes dhe çdo destinacioni në Shqipëri. Çmime të qarta dhe shërbim 24/7.",
  keywords: [
    "taxi Tirane",
    "taxi Tirane Durress",
    "taxi Rinas",
    "transport Shqiperi",
    "taxi aeroporti Tirane",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tirana Ride | Udhëto më larg, mbërrij i qetë",
    description: "Taxi private nga Tirana për çdo destinacion në Shqipëri.",
    url: "https://tiranaride.al",
    siteName: "Tirana Ride",
    locale: "sq_AL",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
