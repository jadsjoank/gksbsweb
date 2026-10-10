import { NextResponse } from "next/server";
import { supabaseAdmin } from "lib/supabaseAdmin";
import { getProfileFromRequest } from "lib/auth";

export async function POST(req: Request) {
  try {
    const sessionProfile = await getProfileFromRequest();
    if (!sessionProfile) {
      return NextResponse.json({ error: "Anda harus login terlebih dahulu." }, { status: 401 });
    }

    const body = await req.json();
    const {
      position_id,
      profile_id,
      full_name,
      email,
      phone,
      motivation,
      profession_status,
      device_ownership,
      role_interest,
      notes,
    } = body;

    if (profile_id !== sessionProfile.id) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });
    }

    if (!position_id || !full_name || !email || !motivation) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }

    const { data: pos, error: posError } = await supabaseAdmin
      .from("volunteer_positions")
      .select("id, is_open")
      .eq("id", position_id)
      .single();

    if (posError || !pos || !pos.is_open) {
      return NextResponse.json({ error: "Posisi ini sudah tidak tersedia." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("volunteer_assignments")
      .select("id")
      .eq("position_id", position_id)
      .eq("profile_id", profile_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Anda sudah mendaftar untuk posisi ini." }, { status: 400 });
    }

    const phoneNumeric = phone ? Number(String(phone).replace(/\D/g, "")) || null : null;
    const extraNotes = typeof notes === "string" && notes.trim()
      ? notes
      : JSON.stringify({
          profession_status: Array.isArray(profession_status) ? profession_status : [],
          device_ownership: Array.isArray(device_ownership) ? device_ownership : [],
          role_interest: role_interest || null,
        });

    const { error: insertError } = await supabaseAdmin
      .from("volunteer_assignments")
      .insert([{
        position_id,
        profile_id,
        full_name,
        email,
        phone: phoneNumeric,
        motivation,
        notes: extraNotes,
        status: "pending",
      }]);

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Anda sudah mendaftar untuk posisi ini." }, { status: 400 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
