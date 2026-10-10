import React from "react";

interface CardProps {
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export function Card({ title, description, footer }: CardProps) {
  return (
    <div className="rounded-3xl border border-gksbs-border bg-white p-6 shadow-sm shadow-slate-200">
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gksbs-brown">{title}</h3>
        <p className="text-sm leading-6 text-gksbs-brown-medium">{description}</p>
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}
