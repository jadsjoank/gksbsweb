"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "lib/validation/auth";
import { AuthForm } from "components/AuthForm";
import { useAuthStore } from "lib/store/useAuthStore";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gksbs-border border-t-slate-900" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const requestedRedirect = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({ error: "Server error. Please try again." }));

      if (!response.ok) {
        setError(result.error || "Login gagal. Periksa email dan password Anda.");
        return;
      }

      // Update Zustand store so Navbar reflects login immediately
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email,
          role: result.user.role || "User",
        });
      }

      const redirectTo = requestedRedirect || (result.user?.role === "Admin" ? "/admin/dashboard" : "/");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Masuk ke Akun Anda"
      subtitle="Selamat kembali di platform GKSBS"
      onSubmit={handleSubmit(onSubmit)}
      isLoading={isLoading}
      error={error}
    >
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
            autoComplete="current-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
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
      </div>

      {/* Footer Links */}
      <div className="pt-4 text-center">
        <Link href="/forgot-password" className="mb-3 block text-sm font-semibold text-gksbs-brown hover:underline">
          Lupa password?
        </Link>
        <p className="text-sm text-gksbs-brown-medium">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-gksbs-brown hover:text-gksbs-brown-accent transition-colors">
            Daftar di sini
          </Link>
        </p>
      </div>
    </AuthForm>
  );
}
