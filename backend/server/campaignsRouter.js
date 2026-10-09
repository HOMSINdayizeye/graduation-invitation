import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { verifyAccessToken } from "./_core/jwt.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { Campaign } from "./models/campaign.js";
import { OtpRequest } from "./models/otpRequest.js";
import { getSettings } from "./models/setting.js";

const VERIFIED_WINDOW_HOURS = 24;
const MAX_IMAGE_CHARS = 2_500_000;

const text = (max) => z.string().trim().max(max);
const venue = z.object({ name: text(120), location: text(160), directions: text(600) });

const campaignInput = z.object({
  id: z.string().regex(/^campaign-[a-z0-9-]{6,60}$/, "Invalid campaign id"),
  email: z.string().trim().toLowerCase().email(),
  templateId: text(40),
  graduate: z.object({ name: text(80), nickname: text(80), phone: text(30), email: text(120), date: text(20), message: text(600) }),
  ceremony: venue,
  celebration: venue,
  invitees: z.array(z.object({ id: text(60).min(1), name: text(80), phone: text(30) })).min(1).max(200),
  delivery: z.enum(["link", "qr", "both"]),
  image: z.string().max(MAX_IMAGE_CHARS, "The photo is too large; pick a smaller image.").nullable(),
  createdAt: z.string().max(40).optional(),
});

function requireDb() {
  if (!isDbConnected()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The service is not connected to its database yet. Please try again later." });
}

// Saving requires the email to have passed the one-time code recently, unless the admin switched codes off.
async function assertVerified(email) {
  const settings = await getSettings();
  if (!settings.otpRequired) return;
  const since = new Date(Date.now() - VERIFIED_WINDOW_HOURS * 60 * 60 * 1000);
  const proof = await OtpRequest.findOne({ email, status: { $in: ["verified", "bypassed"] }, created_at: { $gte: since } });
  if (!proof) throw new TRPCError({ code: "FORBIDDEN", message: "Verify your email with a code before saving an invitation." });
}

// Resolves a creator token to its email, or null when missing or invalid.
function ownerEmail(token) {
  if (!token) return null;
  const result = verifyAccessToken(token);
  return result.valid && result.decoded?.scope === "creator" ? String(result.decoded.email ?? "").toLowerCase() : null;
}

export const campaignsRouter = router({
  // Every invitation this email created, newest first, including guest phone numbers.
  listMine: publicProcedure.input(z.object({ token: z.string().min(10) })).query(async ({ input }) => {
    requireDb();
    const email = ownerEmail(input.token);
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Verify your email again to see your invitations." });
    const docs = await Campaign.find({ email }).sort({ created_at: -1 });
    return docs.map((doc) => doc.toOwner());
  }),

  // Stores (or re-stores) a finished invitation so every guest link resolves on any device.
  create: publicProcedure.input(campaignInput).mutation(async ({ input }) => {
    requireDb();
    await assertVerified(input.email);
    const { id, createdAt: _clientTime, ...rest } = input;
    const existing = await Campaign.findOne({ key: id });
    if (existing && existing.email !== input.email) throw new TRPCError({ code: "FORBIDDEN", message: "This invitation belongs to another email." });
    const doc = await Campaign.findOneAndUpdate({ key: id }, { key: id, ...rest }, { new: true, upsert: true, setDefaultsOnInsert: true });
    return doc.toPublic();
  }),

  // Public read by id: the id is random, and the response hides phone numbers and the creator's email.
  get: publicProcedure.input(z.object({ id: z.string().min(1).max(80), token: z.string().optional() })).query(async ({ input }) => {
    requireDb();
    const doc = await Campaign.findOne({ key: input.id });
    if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "This invitation link is not valid or has been removed." });
    return ownerEmail(input.token) === doc.email ? doc.toOwner() : doc.toPublic();
  }),
});
