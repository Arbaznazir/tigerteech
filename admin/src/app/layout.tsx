import type { Metadata } from "next";
import { Caveat, Oswald, Yellowtail } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const yellowtail = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Tigerteeh Seller Panel",
  description: "Admin dashboard for Tigerteeh Clothing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${yellowtail.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
