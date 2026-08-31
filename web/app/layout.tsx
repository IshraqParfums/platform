import type { Metadata } from "next";
import {
  Fraunces,
  Instrument_Serif,
  JetBrains_Mono,
  Jost,
  Manrope,
  Noto_Nastaliq_Urdu,
} from "next/font/google";
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

/* ---- v2 home stack -------------------------------------------------
   Loaded alongside the three above, not in place of them: every page but
   the home page still sets its type in Fraunces/Manrope/JetBrains. These
   three cost nothing on those routes — next/font only serves the faces a
   rendered page actually references. */

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/* Nastaliq is a large face and there is no lighter subset that still
   shapes correctly — "arabic" is the one that carries Urdu. */
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Ishraq Parfums | Perfume, composed for you",
    template: "%s · Ishraq Parfums",
  },
  description:
    "Small-batch perfumes built from a real perfumer's palette, and a bespoke blend composed around your answers. Handcrafted in India.",
  openGraph: {
    title: "Ishraq Parfums | Perfume, composed for you",
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
      className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} ${instrumentSerif.variable} ${jost.variable} ${notoNastaliqUrdu.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
