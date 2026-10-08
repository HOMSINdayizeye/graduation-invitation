import { adminRouter } from "./adminRouter.js";
import { authRouter } from "./authRouter.js";
import { otpRouter } from "./otpRouter.js";
import { templatesRouter } from "./templatesRouter.js";
import { systemRouter } from "./_core/systemRouter.js";
import { router } from "./_core/trpc.js";

// Every API route lives under /api/ so the gateway can route it.
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  templates: templatesRouter,
  otp: otpRouter,
  admin: adminRouter,
});

export const AppRouter = appRouter;
