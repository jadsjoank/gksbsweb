import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toko GKSBS | Perlengkapan Pelayanan",
  description: "Jelajahi produk dan perlengkapan pelayanan GKSBS Tanjung Karang.",
  alternates: { canonical: "/ecommerce" },
};

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
