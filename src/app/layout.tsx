import type { Metadata } from "next";
import { Bebas_Neue, Caveat, Montserrat, Permanent_Marker } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomDock } from "@/components/layout/MobileBottomDock";
import { IntroPreloader } from "@/components/providers/IntroPreloader";
import { StoreHydration } from "@/components/providers/StoreHydration";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const brush = Permanent_Marker({
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
      className={`${montserrat.variable} ${bebas.variable} ${caveat.variable} ${brush.variable} intro-loading h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.remove('intro-loading');}}catch(e){}})();`,
          }}
        />
        <StoreHydration />
        <IntroPreloader />
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileBottomDock />
      </body>
    </html>
  );
}
