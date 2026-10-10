import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atur Ulang Password | GKSBS Tanjung Karang",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
