import { authRouter } from "./authRouter.js";
import { systemRouter } from "./_core/systemRouter.js";
import { router } from "./_core/trpc.js";

// Every API route lives under /api/ so the gateway can route it.
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  // TODO: add feature routers here.
});

export const AppRouter = appRouter;
