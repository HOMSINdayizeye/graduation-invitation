import express from "express";
import fs from "fs";
import path from "path";

// Serves the frontend build when it exists next to the backend (single-server deployment).
// When the frontend is hosted elsewhere (Vercel), non-API routes answer with a small status message instead.
export function serveStatic(app) {
  const distPath = path.resolve(process.cwd(), "..", "frontend", "dist");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(indexPath)) {
    console.log("[Static] No frontend build found; running as API only.");
    app.use("*", (_req, res) => {
      res.json({ ok: true, service: "graduation-invitation-api", message: "API is running. The frontend is hosted separately." });
    });
    return;
  }

  app.use(express.static(distPath));
  // Fall through to index.html so client-side routes work on refresh.
  app.use("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
