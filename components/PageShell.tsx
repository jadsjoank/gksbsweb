import React from "react";

interface PageShellProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="bg-surface min-h-screen">
      <div className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-12">
          <p className="label-caps mb-3">GKSBS</p>
          <h1 className="text-h1 font-black tracking-tighter">{title}</h1>
          <p className="mt-3 text-body text-on-surface-muted max-w-2xl">{description}</p>
        </div>
      </div>
      <div className="container py-10">{children}</div>
    </section>
  );
}
