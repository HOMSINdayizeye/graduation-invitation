import { createTRPCReact } from "@trpc/react-query";
// Type-only import: erased at build time, gives the client the backend router's shape.
import type { appRouter } from "../../../backend/server/routers.js";

export const trpc = createTRPCReact<typeof appRouter>();
