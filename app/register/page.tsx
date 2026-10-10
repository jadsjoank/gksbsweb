"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "lib/validation/auth";
import { AuthForm } from "components/AuthForm";
import { PasswordStrengthIndicator } from "components/PasswordStrengthIndicator";
import { useAuthStore } from "lib/store/useAuthStore";
import { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gksbs-border border-t-slate-900" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Where to redirect after registration (default: home page)
  const redirectTo = searchParams.get("redirect") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({ error: "Server error. Please try again." }));

      if (!response.ok) {
        setError(result.error || "Pendaftaran gagal. Silakan coba lagi.");
        return;
      }

      // Update Zustand store so Navbar reflects registration immediately
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email ?? data.email,
          role: "User",
        });
      }

      // Redirect to intended page or home
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Buat Akun Baru"
      subtitle="Bergabunglah dengan komunitas GKSBS"
      onSubmit={handleSubmit(onSubmit)}
      isLoading={isLoading}
      error={error}
    >
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gksbs-brown mb-2">
          Nama Lengkap
        </label>
        <input
          id="name"
          autoComplete="name"
          type="text"
          placeholder="Nama Anda"
          {...register("name")}
          className="w-full px-4 py-3 border border-gksbs-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gksbs-gold text-gksbs-brown bg-white"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gksbs-brown mb-2">
          Email
        </label>
        <input
          id="email"
          autoComplete="email"
          type="email"
          placeholder="nama@contoh.com"
          {...register("email")}
          className="w-full px-4 py-3 border border-gksbs-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gksbs-gold text-gksbs-brown bg-white"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gksbs-brown mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            autoComplete="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password", {
              onChange: (e) => setPassword(e.target.value),
            })}
            className="w-full px-4 py-3 pr-24 border border-gksbs-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gksbs-gold text-gksbs-brown bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-gksbs-brown hover:text-gksbs-brown-accent"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        <PasswordStrengthIndicator password={passwordValue || ""} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gksbs-brown mb-2">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            autoComplete="new-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="w-full px-4 py-3 pr-24 border border-gksbs-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gksbs-gold text-gksbs-brown bg-white"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-gksbs-brown hover:text-gksbs-brown-accent"
          >
            {showConfirmPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Footer Links */}
      <div className="pt-4 text-center">
        <p className="text-sm text-gksbs-brown-medium">
          Sudah punya akun?{" "}
          <Link
            href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-gksbs-brown hover:text-gksbs-brown-accent transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthForm>
  );
}
