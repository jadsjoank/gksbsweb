"use client";

import { useEffect, useState } from "react";

type Comment = { id: string; content: string; created_at: string; user_id: string };

export default function WartaInteractions({ newsId, initialLikes }: { newsId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const response = await fetch(`/api/warta-gereja?newsId=${newsId}`);
    const data = await response.json();
    if (data.status === "ok") { setComments(data.comments); setLikes(data.likes); }
  };
  useEffect(() => { load(); }, [newsId]);

  const like = async () => {
    setMessage("");
    const response = await fetch("/api/warta-gereja", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsId }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.message || "Silakan login terlebih dahulu.");
    setLikes(data.likes);
  };

  const comment = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/warta-gereja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsId, content }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.message || "Komentar gagal dikirim.");
    else { setContent(""); await load(); }
    setLoading(false);
  };

  return (
    <div className="mt-8 border-t border-[#e5e5e5] pt-6">
      <button onClick={like} className="border border-black px-4 py-2 text-body-sm font-semibold hover:bg-black hover:text-white transition-colors">Suka ({likes})</button>
      <form onSubmit={comment} className="mt-6 space-y-3">
        <label className="label-caps block">Komentar</label>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} maxLength={1000} placeholder="Tulis komentar..." className="w-full border border-[#e5e5e5] p-3 text-body-sm resize-y" />
        <button disabled={loading || !content.trim()} className="btn-primary disabled:opacity-50">{loading ? "Mengirim..." : "Kirim Komentar"}</button>
      </form>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      <div className="mt-6 space-y-4">
        {comments.map((item) => <div key={item.id} className="border-l-2 border-[#e5e5e5] pl-4"><p className="text-body">{item.content}</p><p className="mt-1 text-caption text-on-surface-muted">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p></div>)}
      </div>
    </div>
  );
}
