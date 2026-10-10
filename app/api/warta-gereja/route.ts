import { NextResponse } from "next/server";
import { getProfileFromRequest } from "lib/auth";
import { supabaseAdmin } from "lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const newsId = searchParams.get("newsId");
  if (!newsId) return NextResponse.json({ status: "error", message: "newsId wajib diisi." }, { status: 400 });

  const [{ data: comments, error: commentsError }, { count: likes }] = await Promise.all([
    supabaseAdmin.from("church_news_comments").select("id,content,created_at,user_id").eq("news_id", newsId).order("created_at", { ascending: false }),
    supabaseAdmin.from("church_news_likes").select("news_id", { count: "exact", head: true }).eq("news_id", newsId),
  ]);

  if (commentsError) return NextResponse.json({ status: "error", message: commentsError.message }, { status: 500 });
  return NextResponse.json({ status: "ok", comments: comments ?? [], likes: likes ?? 0 });
}

export async function POST(req: Request) {
  const profile = await getProfileFromRequest();
  if (!profile) return NextResponse.json({ status: "unauthorized", message: "Silakan login untuk berkomentar." }, { status: 401 });

  try {
    const { newsId, content } = await req.json();
    if (!newsId || !content?.trim()) return NextResponse.json({ status: "error", message: "Komentar tidak boleh kosong." }, { status: 400 });
    if (content.trim().length > 1000) return NextResponse.json({ status: "error", message: "Komentar maksimal 1000 karakter." }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("church_news_comments").insert({ news_id: newsId, user_id: profile.id, content: content.trim() }).select().single();
    if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    return NextResponse.json({ status: "ok", comment: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const profile = await getProfileFromRequest();
  if (!profile) return NextResponse.json({ status: "unauthorized", message: "Silakan login untuk menyukai warta." }, { status: 401 });

  const { newsId } = await req.json();
  if (!newsId) return NextResponse.json({ status: "error", message: "newsId wajib diisi." }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("church_news_likes").select("news_id").eq("news_id", newsId).eq("user_id", profile.id).maybeSingle();
  const { error } = existing
    ? await supabaseAdmin.from("church_news_likes").delete().eq("news_id", newsId).eq("user_id", profile.id)
    : await supabaseAdmin.from("church_news_likes").insert({ news_id: newsId, user_id: profile.id });

  if (error) return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  const { count } = await supabaseAdmin.from("church_news_likes").select("news_id", { count: "exact", head: true }).eq("news_id", newsId);
  return NextResponse.json({ status: "ok", liked: !existing, likes: count ?? 0 });
}
