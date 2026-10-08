import bcrypt from "bcrypt";
import { ENV } from "./_core/env.js";
import { isDbConnected } from "./db.js";
import { DEFAULT_TEMPLATES } from "#shared/templates.js";
import { Template } from "./models/template.js";
import { User } from "./models/user.js";

const SALT_ROUNDS = 10;

// Creates the administrator from ADMIN_EMAIL / ADMIN_PASSWORD on startup, or promotes an existing account with that email.
export async function ensureAdminUser() {
  if (!isDbConnected() || !ENV.adminEmail) return;
  const existing = await User.findOne({ email: ENV.adminEmail });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`[Seed] Promoted ${ENV.adminEmail} to admin`);
    }
    return;
  }
  if (!ENV.adminPassword) {
    console.warn(`[Seed] ADMIN_EMAIL is set but ADMIN_PASSWORD is empty; admin ${ENV.adminEmail} was not created.`);
    return;
  }
  if (ENV.adminPassword.length < 8) {
    console.warn("[Seed] ADMIN_PASSWORD must be at least 8 characters; admin was not created.");
    return;
  }
  const password = await bcrypt.hash(ENV.adminPassword, SALT_ROUNDS);
  await User.create({ name: ENV.adminName || "Administrator", email: ENV.adminEmail, password, role: "admin" });
  console.log(`[Seed] Created admin account ${ENV.adminEmail}`);
}

// Inserts any built-in template that is missing; existing rows keep the admin's edits.
export async function ensureTemplates() {
  if (!isDbConnected()) return;
  for (const item of DEFAULT_TEMPLATES) {
    const { id, ...rest } = item;
    await Template.updateOne({ key: id }, { $setOnInsert: { key: id, ...rest } }, { upsert: true });
  }
}
