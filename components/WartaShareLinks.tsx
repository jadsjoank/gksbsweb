import Link from "next/link";

export default function WartaShareLinks({ id, title }: { id: string; title: string }) {
  const shareUrl = `https://gksbs.com/warta-gereja/${id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title} - Warta Gereja GKSBS`);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#e5e5e5] pt-5">
      <span className="label-caps text-on-surface-muted">Bagikan</span>
      <Link
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-[#25D366] px-3 py-2 text-caption font-semibold text-[#128C7E] hover:bg-[#25D366]/10"
      >
        WhatsApp
      </Link>
      <Link
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-[#1877F2] px-3 py-2 text-caption font-semibold text-[#1877F2] hover:bg-[#1877F2]/10"
      >
        Facebook
      </Link>
    </div>
  );
}
