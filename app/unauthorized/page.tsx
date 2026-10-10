import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="container py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-gksbs-brown-accent">Unauthorized</p>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-gksbs-brown">Access denied</h1>
      <p className="mt-4 text-gksbs-brown-medium">You do not have permission to view this page.</p>
      <div className="mt-8">
        <Link href="/" className="rounded-full bg-gksbs-brown px-6 py-3 text-sm font-semibold text-white hover:bg-gksbs-brown-medium">
          Back to home
        </Link>
      </div>
    </div>
  );
}
