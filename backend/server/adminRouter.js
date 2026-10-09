import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getEmailCredits, isMailConfigured, mailTransportName } from "./_core/mail.js";
import { adminProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { Campaign } from "./models/campaign.js";
import { OtpRequest } from "./models/otpRequest.js";
import { getSettings } from "./models/setting.js";
import { Template } from "./models/template.js";
import { User } from "./models/user.js";

function requireDb() {
  if (!isDbConnected()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not connected." });
}

// Everything here is admin-only (adminProcedure) and backs the /admin panel.
export const adminRouter = router({
  // Every created invitation with its full guest list, newest first, for the admin's grouped view and exports.
  campaigns: adminProcedure.query(async () => {
    requireDb();
    const docs = await Campaign.find().sort({ created_at: -1 });
    return docs.map((doc) => doc.toOwner());
  }),

  stats: adminProcedure.query(async () => {
    requireDb();
    const [users, templatesActive, byStatus, distinctEmails] = await Promise.all([
      User.countDocuments(),
      Template.countDocuments({ active: true }),
      OtpRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      OtpRequest.distinct("email"),
    ]);
    const counts = { sent: 0, verified: 0, bypassed: 0, failed: 0 };
    for (const row of byStatus) counts[row._id] = row.count;
    return { users, templatesActive, otp: counts, otpTotal: Object.values(counts).reduce((a, b) => a + b, 0), distinctEmails: distinctEmails.length, mailConfigured: isMailConfigured() };
  }),

  users: adminProcedure.query(async () => {
    requireDb();
    const docs = await User.find().sort({ created_at: -1 });
    return docs.map((doc) => ({
      ...doc.toPublic(),
      createdAt: doc.created_at,
      locked: Boolean(doc.access_control?.is_locked),
      failedAttempts: doc.access_control?.last_login_attempt ?? 0,
    }));
  }),

  unlockUser: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    requireDb();
    const doc = await User.findById(input.id);
    if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    doc.access_control = { is_locked: false, reason: null, last_login_attempt: 0 };
    await doc.save();
    return { success: true };
  }),

  otpRequests: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(500).default(200) }).optional()).query(async ({ input }) => {
    requireDb();
    const docs = await OtpRequest.find().sort({ created_at: -1 }).limit(input?.limit ?? 200);
    return docs.map((doc) => doc.toPublic());
  }),

  // Distinct people who requested a code, with their latest template and outcome.
  otpEmails: adminProcedure.query(async () => {
    requireDb();
    const rows = await OtpRequest.aggregate([
      { $sort: { created_at: -1 } },
      { $group: { _id: "$email", requests: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] } }, lastTemplate: { $first: "$templateId" }, lastStatus: { $first: "$status" }, lastAt: { $first: "$created_at" } } },
      { $sort: { lastAt: -1 } },
    ]);
    return rows.map((row) => ({ email: row._id, requests: row.requests, verified: row.verified, lastTemplate: row.lastTemplate, lastStatus: row.lastStatus, lastAt: row.lastAt }));
  }),

  settings: adminProcedure.query(async () => {
    requireDb();
    return (await getSettings()).toPublic();
  }),

  updateSettings: adminProcedure
    .input(z.object({ otpRequired: z.boolean().optional(), allowWithoutOtpWhenEmailExhausted: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      requireDb();
      const doc = await getSettings();
      if (input.otpRequired !== undefined) doc.otpRequired = input.otpRequired;
      if (input.allowWithoutOtpWhenEmailExhausted !== undefined) doc.allowWithoutOtpWhenEmailExhausted = input.allowWithoutOtpWhenEmailExhausted;
      await doc.save();
      return doc.toPublic();
    }),

  emailCredits: adminProcedure.query(async () => {
    try {
      return { ...(await getEmailCredits()), error: "" };
    } catch (error) {
      return { configured: isMailConfigured(), transport: mailTransportName(), credits: null, plan: null, account: null, error: String(error?.message ?? error) };
    }
  }),
});
