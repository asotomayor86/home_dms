import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SectionWatermark } from "@/components/section-watermark";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente manuscrita (marcador) para la marca de agua gigante de cada sección.
const caveat = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "HOME DMS",
  description: "Gestión doméstica familiar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <SectionWatermark />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
