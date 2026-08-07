import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: {
    default: "Ishraq Parfums — Perfume, composed for you",
    template: "%s · Ishraq Parfums",
  },
  description:
    "Small-batch perfumes built from a real perfumer's palette, and a bespoke blend composed around your answers. Handcrafted in India.",
  openGraph: {
    title: "Ishraq Parfums — Perfume, composed for you",
    description:
      "Small-batch perfumes built from a real perfumer's palette, and a bespoke blend composed around your answers.",
    type: "website",
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
      className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
