import { redirect } from "next/navigation";
import { requireAdmin } from "lib/auth";
import { VerifyOtpForm } from "./VerifyOtpForm";

export default async function VerifyOtpPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectTo =
    params.redirect?.startsWith("/admin/") && params.redirect !== "/admin/verify-otp"
      ? params.redirect
      : "/admin/dashboard";

  const verifiedAdmin = await requireAdmin();
  if (verifiedAdmin) redirect(redirectTo);

  const admin = await requireAdmin({ requireMfa: false });
  if (!admin) redirect("/login");
  return <VerifyOtpForm redirectTo={redirectTo} />;
}
