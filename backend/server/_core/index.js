import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { connectDb } from "../db.js";
import { ENV } from "./env.js";
import { ensureAdminUser, ensureTemplates } from "../seedAdmin.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic } from "./vite.js";

function isPortAvailable(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  // Allows a frontend hosted on another domain (CORS_ORIGIN, comma-separated) to call the API with its Bearer token.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = origin && (ENV.corsOrigins.includes("*") || ENV.corsOrigins.includes(origin));
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    }
    if (req.method === "OPTIONS") return res.sendStatus(allowed ? 204 : 403);
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Production serves the built frontend; in development Vite serves it on 5173 and proxies /api here.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    console.log("Development mode: API only. Start the frontend with `pnpm --filter graduation-invitation-frontend dev`.");
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.warn(`Port ${preferredPort} is busy, using port ${port} instead. Update the frontend proxy target in frontend/vite.config.js to match.`);
  }

  // Open the port first so the host sees the service immediately; the database connects in the background.
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    connectDb()
      .then(async (connected) => {
        if (!connected) return;
        await ensureAdminUser();
        await ensureTemplates();
      })
      .catch((error) => console.error("[Startup] Database setup failed:", error));
  });
}

startServer().catch(console.error);
