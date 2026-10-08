import { createHash, randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env.js";
import { sendEmail } from "./_core/mail.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { OtpRequest } from "./models/otpRequest.js";
import { getSettings } from "./models/setting.js";

const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_PER_WINDOW = 5;

const emailField = z.string().trim().toLowerCase().email("Enter a valid email address");

// Codes are stored hashed together with the email so a leaked database row cannot be replayed.
const hashCode = (email, code) => createHash("sha256").update(`${email}:${code}`).digest("hex");

function requireDb() {
  if (!isDbConnected()) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The service is not connected to its database yet. Please try again later." });
  }
}

const codeEmailHtml = (code) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:28px;color:#263334">
    <p style="font-size:12px;letter-spacing:.2em;color:#8b9891;margin:0 0 14px">${ENV.mailFromName.toUpperCase()}</p>
    <h1 style="font-size:24px;margin:0 0 12px">Your one-time code</h1>
    <p style="font-size:14px;line-height:1.5;margin:0 0 20px">Use this code to continue creating your graduation invitation. It expires in ${CODE_TTL_MINUTES} minutes.</p>
    <p style="font-size:34px;letter-spacing:.3em;font-weight:bold;margin:0 0 20px">${code}</p>
    <p style="font-size:12px;color:#8b9891;margin:0">If you did not request this, you can ignore this email.</p>
  </div>`;

export const otpRouter = router({
  // Sends a code by email, or lets the person through when the admin has allowed that.
  request: publicProcedure
    .input(z.object({ email: emailField, templateId: z.string().max(40).optional(), purpose: z.enum(["create", "view"]).default("create") }))
    .mutation(async ({ input, ctx }) => {
      requireDb();
      const settings = await getSettings();
      const base = { email: input.email, templateId: input.templateId ?? "", purpose: input.purpose, ip: ctx.req.ip ?? "" };

      if (!settings.otpRequired) {
        await OtpRequest.create({ ...base, status: "bypassed", error: "OTP not required (admin setting)" });
        return { bypass: true, reason: "No code is needed right now. You can continue." };
      }

      const windowStart = new Date(Date.now() - CODE_TTL_MINUTES * 60 * 1000);
      const recent = await OtpRequest.countDocuments({ email: input.email, status: "sent", created_at: { $gte: windowStart } });
      if (recent >= MAX_REQUESTS_PER_WINDOW) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many codes requested. Wait ${CODE_TTL_MINUTES} minutes and try again.` });
      }

      const code = String(randomInt(0, 1000000)).padStart(6, "0");
      const doc = await OtpRequest.create({
        ...base,
        codeHash: hashCode(input.email, code),
        status: "sent",
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      });

      try {
        await sendEmail({ to: input.email, subject: `${code} is your ${ENV.mailFromName} code`, html: codeEmailHtml(code) });
        return { bypass: false, expiresInMinutes: CODE_TTL_MINUTES };
      } catch (error) {
        const detail = String(error?.message ?? error).slice(0, 300);
        doc.error = detail;
        // Email quota exhausted or service down: the admin can allow people through without a code.
        if (settings.allowWithoutOtpWhenEmailExhausted) {
          doc.status = "bypassed";
          doc.codeHash = "";
          await doc.save();
          return { bypass: true, reason: "We could not send an email right now, so you may continue without a code." };
        }
        doc.status = "failed";
        await doc.save();
        console.error("[OTP] Email delivery failed:", detail);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `We could not send your code by email right now. Please try again later. (${detail})` });
      }
    }),

  verify: publicProcedure
    .input(z.object({ email: emailField, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") }))
    .mutation(async ({ input }) => {
      requireDb();
      const doc = await OtpRequest.findOne({ email: input.email, status: "sent" }).sort({ created_at: -1 });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "No active code for this email. Request a new one." });
      if (doc.expiresAt && doc.expiresAt < new Date()) {
        doc.status = "failed";
        doc.error = "expired";
        await doc.save();
        throw new TRPCError({ code: "BAD_REQUEST", message: "That code has expired. Request a new one." });
      }
      if (doc.attempts >= MAX_VERIFY_ATTEMPTS) {
        doc.status = "failed";
        doc.error = "too many attempts";
        await doc.save();
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many wrong attempts. Request a new code." });
      }
      if (doc.codeHash !== hashCode(input.email, input.code)) {
        doc.attempts += 1;
        await doc.save();
        const left = MAX_VERIFY_ATTEMPTS - doc.attempts;
        throw new TRPCError({ code: "UNAUTHORIZED", message: `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} left.` });
      }
      doc.status = "verified";
      doc.verifiedAt = new Date();
      await doc.save();
      return { ok: true };
    }),
});
