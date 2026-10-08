const jwtSecret = process.env.JWT_SECRET ?? "";
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}
if (!jwtSecret) console.warn("[Auth] JWT_SECRET is not set; using an insecure development secret.");

export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.MONGODB_DB_NAME ?? "",
  jwtSecret: jwtSecret || "gradinvite-dev-secret",
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
};
