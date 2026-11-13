import type { Metadata } from "next";
import { Caveat, Montserrat, Oswald, Yellowtail } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomDock } from "@/components/layout/MobileBottomDock";
import { StoreHydration } from "@/components/providers/StoreHydration";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const brush = Yellowtail({
  variable: "--font-brush",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tigerteehclothing.com"),
  title: {
    default: "Tigerteeh Clothing | Wear Your Wild Side",
    template: "%s | Tigerteeh Clothing",
  },
  description:
    "Bold outfits. Fierce personality. Premium animal-print co-ord sets made for the unstoppable you.",
  openGraph: {
    title: "Tigerteeh Clothing",
    description: "Wear the Wild. Live the Bold.",
    images: ["/brand-logo.png"],
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
      className={`${montserrat.variable} ${oswald.variable} ${caveat.variable} ${brush.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <StoreHydration />
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileBottomDock />
      </body>
    </html>
  );
}
