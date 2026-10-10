"use client";

import { ReactNode } from "react";

interface AuthFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  submitLabel?: string;
  error?: string | null;
}

export function AuthForm({ children, onSubmit, title, subtitle, isLoading, isSubmitDisabled, submitLabel, error }: AuthFormProps) {
  return (
    <div className="min-h-screen bg-gksbs-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-gksbs-border shadow-sm p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="h3 text-gksbs-brown mb-2">{title}</h1>
            {subtitle && (
              <p className="text-body text-gksbs-brown-medium">{subtitle}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            {children}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitDisabled}
              className="w-full btn-primary rounded-full py-3 font-semibold text-gksbs-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-100"
            >
              {isLoading ? "Memproses..." : submitLabel ?? "Lanjutkan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
