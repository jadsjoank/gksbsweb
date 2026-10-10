import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET() {
  const profile = await getProfileFromRequest();

  if (!profile) {
    return NextResponse.json(
      { status: "unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.json({ status: "ok", profile });
}

export async function PUT(req: Request) {
  try {
    const profile = await getProfileFromRequest();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, phone, date_of_birth, address } = body;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: full_name ?? undefined,
        phone: phone ?? undefined,
        date_of_birth: date_of_birth || null,
        address: address ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", message: "Profile updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
