const jwtSecret = process.env.JWT_SECRET ?? "";
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}
if (!jwtSecret) console.warn("[Auth] JWT_SECRET is not set; using an insecure development secret.");

export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  // Browser origins allowed to call the API: FRONTEND_URL (preferred name) or CORS_ORIGIN, comma-separated.
  corsOrigins: `${process.env.FRONTEND_URL ?? ""},${process.env.CORS_ORIGIN ?? ""}`.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean),
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.MONGODB_DB ?? process.env.MONGODB_DB_NAME ?? "",
  jwtSecret: jwtSecret || "gradinvite-dev-secret",
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  smtpHost: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  smtpPort: Number(process.env.BREVO_SMTP_PORT || 587),
  smtpUser: process.env.BREVO_SMTP_USER ?? "",
  smtpKey: process.env.BREVO_SMTP_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "",
  mailFromName: process.env.MAIL_FROM_NAME || "GradInvite",
};
