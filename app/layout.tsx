import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mundialito — Quiniela del Mundial 2026",
  description: "La quiniela del Mundial 2026 entre amigos. Predecí marcadores y subí en el ranking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e1a",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav user={user} />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-16 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
