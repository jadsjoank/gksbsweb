import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter.").regex(/[A-Z]/, "Password harus memiliki huruf besar.").regex(/[a-z]/, "Password harus memiliki huruf kecil.").regex(/[0-9]/, "Password harus memiliki angka.").regex(/[^A-Za-z0-9]/, "Password harus memiliki karakter khusus."),
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter."),
  name: z.string().min(2, "Nama minimal 2 karakter."),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Password tidak cocok.",
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});
