import type { Metadata } from "next";
import { MinistryProfilePage } from "components/MinistryProfilePage";

export const metadata: Metadata = {
  title: "DIGTIVE | GKSBS Tanjung Karang",
  description: "Profil pelayanan DIGTIVE GKSBS Tanjung Karang.",
};

export default function DigtivePage() {
  return <MinistryProfilePage slug="digtive" />;
}
