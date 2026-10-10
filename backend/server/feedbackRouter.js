import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { Feedback } from "./models/feedback.js";

function requireDb() {
  if (!isDbConnected()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The service is not connected to its database yet. Please try again later." });
}

export const feedbackRouter = router({
  // Public — anyone on an invitation can leave a note.
  create: publicProcedure
    .input(z.object({
      invitationId: z.string().min(1).max(120),
      rating: z.number().int().min(1).max(5),
      message: z.string().trim().min(1).max(2000),
      phone: z.string().max(20).optional().default(""),
    }))
    .mutation(async ({ input, ctx }) => {
      requireDb();
      const doc = await Feedback.create({
        invitationId: input.invitationId,
        rating: input.rating,
        message: input.message,
        phone: input.phone ?? "",
        ip: ctx.req.ip ?? "",
        status: "new",
      });
      return doc.toPublic();
    }),
});