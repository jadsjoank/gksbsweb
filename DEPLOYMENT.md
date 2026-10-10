# Deployment

This application is a Next.js application backed by Supabase, Midtrans, and Hostinger SMTP.

## Environment variables

Copy `.env.example` to `.env.local` for local development and set every value. In Vercel, add the same variables under **Project Settings > Environment Variables** for the environments where they are needed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser and server Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe Supabase anonymous key. |
| `SUPABASE_URL` | Yes | Server-side Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key used by privileged API routes. Never expose it publicly. |
| `SMTP_HOST` | Yes for application email | Hostinger SMTP host from hPanel. |
| `SMTP_PORT` | Yes for application email | `465` for TLS or `587` for STARTTLS. |
| `SMTP_USER` | Yes for application email | Hostinger mailbox used by the application. |
| `SMTP_PASS` | Yes for application email | Hostinger mailbox password. Never commit it. |
| `SMTP_FROM` | Yes for application email | Verified sender mailbox/address. |
| `ADMIN_MFA_SECRET` | Yes | At least 32 random characters for signed admin MFA cookies. |
| `OTP_PEPPER` | Yes | At least 32 random characters for HMAC OTP hashes. |
| `ATTENDANCE_QR_SECRET` | Yes | At least 32 random characters for short-lived attendance QR tokens. |
| `MIDTRANS_SERVER_KEY` | Yes for payments | Midtrans server-side authentication. |
| `MIDTRANS_CLIENT_KEY` | Yes for payments | Midtrans client-side authentication. |
| `MIDTRANS_ENVIRONMENT` | Yes for payments | `sandbox` or `production`. |
| `MIDTRANS_ECOMMERCE_ENABLED` | Recommended | Set to `true` to enable ecommerce checkout; otherwise checkout is disabled. |
| `NEXT_PUBLIC_QRIS_IMAGE_URL` | Optional | Public QRIS image URL shown on the donation page. |

Do not commit `.env.local`, production credentials, service-role keys, SMTP passwords, or payment keys. The repository contains placeholders only.

## Supabase setup

### 1. Create the project and core schema

Create a Supabase project and obtain its URL and API keys from **Project Settings > API**. Before running the feature migrations below, apply the core schema migration for the tables used by the application. The core schema is not included in this repository and must provide at least:

- `profiles`
- `events`
- `attendance`
- `donations`
- `notifications`
- `volunteer_positions`
- `volunteer_assignments`
- `admin_otps`
- `contact_messages`

The `settings` table is optional. If it is not present, the application uses its built-in settings defaults and the admin settings API reports a warning when persistence is unavailable.

That core schema must enable Row Level Security (RLS) on user-owned and sensitive tables and provide policies for the authenticated operations used by the application. At minimum, users should only read or modify their own profile, attendance, donations, volunteer assignments, and notifications; public event/news/product reads should be limited to published/active records; and admin-only mutations should be restricted to the application’s admin roles. The server-only service-role key bypasses RLS, so protect all routes that use it with server-side authentication and authorization.

### 2. Run the repository migrations in order

Run these files in the Supabase SQL Editor, in this order:

1. **Core schema migration** from your database source (required; not present in this repository).
2. `supabase-roles.sql` — extends the existing `profiles.role` check constraint. Run after `profiles` exists.
3. `supabase-warta-gereja.sql` — creates church news, comments, and likes. Run after `profiles` exists.
4. `supabase-ministry-profiles.sql` — creates and seeds ministry profiles.
5. `supabase-ecommerce.sql` — creates the public product catalog, ecommerce orders, and the `product-images` Storage bucket. Run after `profiles` exists because orders reference it.
6. `supabase-core-rls.sql` — applies direct-client RLS policies to the core application tables. Run only after the core schema exists.
7. `supabase-attendance.sql` — adds the unique event/member attendance constraint. Remove existing duplicate member records first if the index creation reports a conflict.
8. `supabase-rate-limits.sql` — creates the persistent storage table and atomic RPC used by the API auth rate limiter.
9. `supabase-audit.sql` — creates webhook idempotency and audit-log storage.

Each migration is intended to be safe to re-run where its DDL uses `if not exists` or conflict handling. Review seed updates before re-running `supabase-ministry-profiles.sql` in a database containing customized ministry content.

### 3. Verify the migration-provided RLS policies

The repository migrations apply these policies:

- `supabase-warta-gereja.sql`: published church news is public; authenticated users can read comments and likes; authenticated users can create comments as themselves; users can manage only their own likes.
- `supabase-ministry-profiles.sql`: ministry profiles are publicly readable.
- `supabase-ecommerce.sql`: only active products are publicly readable.

`supabase-core-rls.sql` defines the direct-client boundary for the core tables: public active-event and open-volunteer-position reads; authenticated users can read their own profile, attendance, donations, notifications, and volunteer assignments; users can update only their own profile and notifications; and contact, OTP, and attendance inserts remain service-role-only through validated API routes. Test these policies against the actual core schema before deploying. Also configure Storage policies for the `product-images` bucket if administrators need to upload or replace product images.

### 4. Configure authentication and URLs

In **Authentication > URL Configuration**, set the production site URL and any local development redirect URLs. Configure Supabase Auth Custom SMTP with the separate `auth@` mailbox for registration verification and password reset. The application uses the separate `noreply@` mailbox through `SMTP_*` for OTP, transaction, and admin notification emails.

## Midtrans setup

Create or select a Midtrans account and copy the sandbox or production server/client keys into the matching environment variables. Set the **Payment Notification URL** to:

```text
https://YOUR_DOMAIN.example/api/payments/webhook
```

Use sandbox keys with `MIDTRANS_ENVIRONMENT=sandbox` during testing. Switch all three Midtrans settings together when moving to production, then verify settlement, pending, expiry, and cancellation notifications in the Midtrans dashboard.

## Deploying to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Keep the detected framework as **Next.js** and use the repository root as the project root.
3. Add all required environment variables under **Project Settings > Environment Variables**. Use separate values for Preview and Production where appropriate.
4. Deploy a Preview first and verify authentication, Supabase reads/writes, email/OTP delivery, and Midtrans sandbox webhooks.
5. Configure the production domain in Vercel and set the same domain in Supabase Auth URL Configuration and Midtrans Payment Notification URL.
6. Deploy to Production, then verify the health of the public pages, admin authorization, payment callbacks, and SMTP sender configuration.

The standard Vercel build command is `next build`; no custom build command is required. The application must have the environment variables available at build time and runtime.

## Production readiness checklist

Complete every item before switching from sandbox to production:

- [ ] Run `npm run validate:env` with real values in the deployment environment.
- [ ] Confirm `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` point to the same Supabase project.
- [ ] Apply the core schema and every feature migration in the order listed above.
- [ ] Confirm RLS is enabled on sensitive tables and test anonymous, authenticated-user, and admin access separately.
- [ ] Confirm service-role keys exist only in server-side environment variables and are absent from client bundles.
- [ ] Confirm Supabase Auth email confirmation, site URL, redirect URLs, and sender configuration.
- [ ] Create an admin account manually and verify a normal user cannot access admin pages or admin APIs.
- [ ] Verify attendance rejects a mismatched event QR token and accepts a valid token only inside the event window.
- [ ] Verify a donation in Midtrans sandbox transitions through pending and settled states exactly once.
- [ ] Verify duplicate webhook delivery does not create a second payment update or notification.
- [ ] Verify ecommerce stock cannot become negative under concurrent checkout attempts.
- [ ] Verify Hostinger SMTP delivery for admin OTP and application notifications, including expired and reused OTPs.
- [ ] Run `npm test`, `npm run lint`, and `npm run build` before deployment.
- [ ] Deploy Preview first, execute the smoke tests above, then promote to Production.
- [ ] Confirm database backups, webhook monitoring, application logs, and a rollback owner are available.

### Minimum RLS smoke test

Use separate anonymous and authenticated Supabase clients. Confirm that:

1. Anonymous users can read only public active events, published news, active products, and public ministry profiles.
2. An authenticated user can read only their own profile, attendance, donations, notifications, and volunteer assignments.
3. An authenticated user cannot read another user's records by changing a UUID in the request.
4. Admin-only writes fail for non-admin users.
5. Direct inserts into OTP, contact, attendance, payment, and audit tables are denied unless intentionally exposed by policy.

The application service-role client bypasses RLS. Therefore, every route that imports `supabaseAdmin` must retain an explicit server-side authentication and authorization check before handling sensitive data.

## Email

Use two separate Hostinger mailboxes:

- `auth@your-domain` is configured as Supabase Auth Custom SMTP for registration verification and password reset. Supabase sends those system emails directly.
- `noreply@your-domain` is configured in `SMTP_USER` and `SMTP_FROM` for application email such as admin OTP, transaction notifications, and admin notifications.

Choose a Hostinger mailbox package whose current per-mailbox hourly/daily limits cover the expected volume. Limits and package quotas can change, so verify the latest values in hPanel before launch. Do not assume a high-volume transactional provider quota.

Configure and verify DNS for the sending domain:

1. SPF authorizes Hostinger to send mail.
2. DKIM is enabled using the record provided by Hostinger.
3. DMARC starts at `p=none`; monitor reports, then increase enforcement after legitimate delivery is confirmed.

Set these application variables in Vercel for Preview and Production as appropriate:

```text
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain
SMTP_PASS=<secret>
SMTP_FROM=GKSBS <noreply@your-domain>
```

`SMTP_FROM` must be either `email@domain` or `Nama <email@domain>`. Do not use Markdown links, HTML, or URLs. Prefer the same domain as `SMTP_USER`; the validator warns when they differ.

Generate signing secrets without printing them into source control:

```bash
openssl rand -base64 48
```

Generate one value for each of `ADMIN_MFA_SECRET`, `OTP_PEPPER`, and `ATTENDANCE_QR_SECRET`. Rotating any of these secrets invalidates active admin MFA cookies or attendance QR tokens as applicable.

Registration, password reset, and OTP delivery are rate-limited by both IP and normalized email address. A resend-verification endpoint is not currently exposed by the application; add one only with the same limits and a cooldown. Per-event admin notifications should eventually be grouped into summaries to protect mailbox quotas; this remains a TODO and no scheduler is introduced here.
