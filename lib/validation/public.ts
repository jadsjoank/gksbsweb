import { z } from "zod";

export const profileCheckSchema = z.object({
  email: z.string().trim().email("Format email tidak valid.").max(254),
  name: z.string().trim().max(100).optional(),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email("Format email tidak valid.").max(254),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
});

export const guestAttendanceSchema = z.object({
  event_id: z.string().trim().min(1).max(100),
  guest_name: z.string().trim().min(2).max(100),
  guest_email: z.string().trim().email("Format email tidak valid.").max(254),
  guest_phone: z.string().trim().max(30).optional(),
});
