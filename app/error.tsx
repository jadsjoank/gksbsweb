"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-gksbs-brown-accent">500</p>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-gksbs-brown">Something went wrong</h1>
      <p className="mt-4 text-gksbs-brown-medium">An unexpected error occurred. Please refresh or try again later.</p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button onClick={reset} className="rounded-full bg-gksbs-brown px-6 py-3 text-sm font-semibold text-white hover:bg-gksbs-brown-medium">
          Retry
        </button>
      </div>
    </div>
  );
}
