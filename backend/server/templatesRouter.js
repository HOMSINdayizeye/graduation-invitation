import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { DEFAULT_TEMPLATES } from "#shared/templates.js";
import { adminProcedure, publicProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { Template } from "./models/template.js";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a hex colour like #d76b4f");

export const templatesRouter = router({
  // Public pages hide inactive templates themselves; admins need the full list.
  list: publicProcedure.query(async () => {
    if (!isDbConnected()) return DEFAULT_TEMPLATES;
    const docs = await Template.find().sort({ sortOrder: 1 });
    return docs.length ? docs.map((doc) => doc.toPublic()) : DEFAULT_TEMPLATES;
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(2, "Name is too short").max(60),
        subtitle: z.string().trim().max(120),
        accent: hexColor,
        sampleName: z.string().trim().max(60),
        active: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isDbConnected()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not connected." });
      const doc = await Template.findOneAndUpdate(
        { key: input.id },
        { name: input.name, subtitle: input.subtitle, accent: input.accent, sampleName: input.sampleName, active: input.active },
        { new: true },
      );
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
      return doc.toPublic();
    }),
});
