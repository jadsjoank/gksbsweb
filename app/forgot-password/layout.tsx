import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Password | GKSBS Tanjung Karang",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
