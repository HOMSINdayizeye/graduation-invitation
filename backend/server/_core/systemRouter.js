import { z } from "zod";
import { ENV } from "./env.js";
import { isMailConfigured, sendEmail } from "./mail.js";
import { adminProcedure, publicProcedure, router } from "./trpc.js";

export const systemRouter = router({
  health: publicProcedure
    .input(z.object({ timestamp: z.number().min(0, "timestamp cannot be negative") }))
    .query(() => ({ ok: true, mail: isMailConfigured() })),

  // Lets an admin confirm the Brevo setup by sending a message to themselves.
  sendTestEmail: adminProcedure.mutation(async ({ ctx }) => {
    const messageId = await sendEmail({
      to: ctx.user.email,
      subject: `${ENV.mailFromName} test email`,
      html: `<p>Your ${ENV.mailFromName} email setup through Brevo works.</p>`,
    });
    return { success: true, messageId };
  }),
})
