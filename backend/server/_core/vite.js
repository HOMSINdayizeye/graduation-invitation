import express from "express";
import fs from "fs";
import path from "path";

// Serves the frontend production build; run from the backend folder (pnpm --filter).
export function serveStatic(app) {
  const distPath = path.resolve(process.cwd(), "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
