import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { sendRoleChangedEmail } from "lib/email";
import { logAuditAction } from "lib/audit";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse("Admin access required");

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, is_active, member_since, last_login, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", users: data ?? [] });
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse("Admin access required");

    const body = await req.json();
    const { id, role, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Whitelist allowed role values — prevent privilege escalation to arbitrary roles
    const VALID_ROLES = ["User", "Admin", "Guest", "Penulis", "Seller", "Bendahara"] as const;
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
    }

    // Prevent admin from removing their own admin role
    if (id === admin.id && role !== undefined && role !== "Admin") {
      return NextResponse.json({ error: "Cannot change your own role." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data: updatedUser, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select("email, full_name, role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditAction({
      actorId: admin.id,
      actorEmail: admin.email,
      entityType: "user",
      entityId: id,
      action: "updated",
      details: {
        role: role ?? null,
        is_active: is_active !== undefined ? Boolean(is_active) : null,
      },
    });

    if (role !== undefined && updatedUser) {
      try {
        await sendRoleChangedEmail(updatedUser.email, updatedUser.full_name ?? "Jemaat", updatedUser.role);
      } catch (emailError) {
        console.error("Role change email failed:", emailError);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
