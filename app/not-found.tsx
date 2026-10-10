import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-gksbs-brown-accent">404</p>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-gksbs-brown">Page not found</h1>
      <p className="mt-4 text-gksbs-brown-medium">The page you were looking for does not exist or has been moved.</p>
      <div className="mt-8">
        <Link href="/" className="rounded-full bg-gksbs-brown px-6 py-3 text-sm font-semibold text-gksbs-gold hover:bg-gksbs-brown-medium">
          Return home
        </Link>
      </div>
    </div>
  );
}
