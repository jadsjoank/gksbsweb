import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Providers } from "../components/Providers";
import { ThemeLoader } from "../components/ThemeLoader";

export const metadata: Metadata = {
  title: "GKSBS Tanjung Karang",
  description:
    "Website resmi GKSBS Tanjung Karang. Temukan jadwal ibadah, berita gereja, pelayanan, kegiatan jemaat, dan informasi kontak.",
  metadataBase: new URL("https://gksbstanjungkarang.org"),
  alternates: { canonical: "/" },
  keywords: ["GKSBS Tanjung Karang", "Gereja Kristen Sumatera Bagian Selatan", "gereja Bandar Lampung", "jadwal ibadah GKSBS", "warta gereja"],
  authors: [{ name: "GKSBS Tanjung Karang" }],
  creator: "GKSBS Tanjung Karang",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "GKSBS",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "GKSBS Tanjung Karang",
    description:
      "Jadwal ibadah, berita, pelayanan, dan informasi GKSBS Tanjung Karang.",
    url: "https://gksbstanjungkarang.org/",
    siteName: "GKSBS",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/community.jpg", width: 1200, height: 630, alt: "GKSBS Tanjung Karang" }],
  },
  twitter: { card: "summary_large_image", title: "GKSBS Tanjung Karang", description: "Website resmi GKSBS Tanjung Karang.", images: ["/community.jpg"] },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "52x52" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2a2119",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gksbs-cream text-gksbs-brown">
        <Providers>
          <ThemeLoader />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Church",
            name: "GKSBS Tanjung Karang",
            url: "https://gksbstanjungkarang.org",
            logo: "https://gksbstanjungkarang.org/logo.png",
            image: "https://gksbstanjungkarang.org/community.jpg",
            telephone: "+6282184571705",
            email: "gksbs.tk@gmail.com",
            address: { "@type": "PostalAddress", streetAddress: "Jl. Sutan Syahrir No.27", addressLocality: "Bandar Lampung", addressRegion: "Lampung", addressCountry: "ID" },
          }) }} />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
