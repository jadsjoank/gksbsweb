const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "ADMIN_MFA_SECRET",
  "OTP_PEPPER",
  "ATTENDANCE_QR_SECRET",
];

if (process.env.MIDTRANS_ECOMMERCE_ENABLED === "true") {
  required.push("MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY");
}

const placeholderPatterns = [
  /^https?:\/\/your-project\.supabase\.co$/i,
  /^https?:\/\/placeholder\.supabase\.co$/i,
  /^placeholder$/i,
  /^your-/i,
  /^replace-with/i,
  /^re_your-/i,
  /^example\.com$/i,
];

function isPlaceholder(value) {
  if (!value || !value.trim()) return true;
  const normalized = value.trim();
  return placeholderPatterns.some((pattern) => pattern.test(normalized));
}

const issues = [];

for (const key of required) {
  const value = process.env[key];

  if (isPlaceholder(value)) {
    issues.push(`${key} is missing or still using a placeholder value.`);
  }
}

for (const key of ["ADMIN_MFA_SECRET", "OTP_PEPPER", "ATTENDANCE_QR_SECRET"]) {
  const value = process.env[key];
  if (value && value.trim().length < 32) {
    issues.push(`${key} must be at least 32 characters long.`);
  }
}

const smtpFrom = process.env.SMTP_FROM?.trim() ?? "";
const smtpFromMatch = smtpFrom.match(/^(?:[^<>\r\n\[\]()]+\s+)?<([^<>\s@()[\]]+@[^<>\s@()[\]]+)>$|^([^<>\s@()[\]]+@[^<>\s@()[\]]+)$/);
if (smtpFrom && (!smtpFromMatch || /\[.*\]\(mailto:|<a\s|:\/\//i.test(smtpFrom))) {
  issues.push("SMTP_FROM must be an email address or Name <email@domain> without Markdown or HTML.");
}

if (smtpFromMatch && process.env.SMTP_USER) {
  const fromEmail = (smtpFromMatch[1] ?? smtpFromMatch[2]).toLowerCase();
  const userDomain = process.env.SMTP_USER.trim().split("@").pop()?.toLowerCase();
  const fromDomain = fromEmail.split("@").pop();
  if (userDomain && fromDomain && userDomain !== fromDomain) {
    console.warn("Warning: SMTP_FROM domain differs from SMTP_USER domain.");
  }
}

if (issues.length > 0) {
  console.error("Environment validation failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  console.error("\nSet the missing values in .env.local or your deployment environment before running the application.");
  process.exit(1);
}

console.log("Environment validation passed for required production variables.");
