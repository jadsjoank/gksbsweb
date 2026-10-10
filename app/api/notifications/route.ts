import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/supabase/server";
import { supabaseAdmin } from "lib/supabaseAdmin";

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { status: "unauthorized", message: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(toNumber(searchParams.get("page"), 1), 1);
  const limit = Math.min(Math.max(toNumber(searchParams.get("limit"), 20), 1), 100);
  const from = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("notifications")
    .select("id,title,body,type,is_read,created_at,metadata", { count: "exact" })
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "ok",
    notifications: data ?? [],
    page,
    limit,
    total: count ?? 0,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { status: "unauthorized", message: "Authentication required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const notificationId = body?.id ?? body?.notification_id;

  if (!notificationId) {
    return NextResponse.json(
      { status: "error", message: "Notification ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("profile_id", user.id)
    .select("id,title,body,type,is_read,created_at,metadata")
    .single();

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", notification: data });
}
