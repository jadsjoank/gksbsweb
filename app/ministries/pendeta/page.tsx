import type { Metadata } from "next";
import { MinistryProfilePage } from "components/MinistryProfilePage";

export const metadata: Metadata = {
  title: "Pendeta | GKSBS Tanjung Karang",
  description: "Profil pelayanan Pendeta GKSBS Tanjung Karang.",
};

export default function PendetaPage() {
  return <MinistryProfilePage slug="pendeta" />;
}
