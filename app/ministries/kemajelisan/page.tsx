import type { Metadata } from "next";
import { MinistryProfilePage } from "components/MinistryProfilePage";

export const metadata: Metadata = {
  title: "Kemajelisan | GKSBS Tanjung Karang",
  description: "Profil pelayanan Kemajelisan GKSBS Tanjung Karang.",
};

export default function KemajelisanPage() {
  return <MinistryProfilePage slug="kemajelisan" />;
}
