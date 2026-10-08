import { build } from "esbuild";

await build({
  entryPoints: ["server/_core/index.js"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
  // The bundle is always the production build, so no NODE_ENV prefix is needed on Windows.
  define: { "process.env.NODE_ENV": '"production"' },
  mainFields: ["module", "main"],
  target: "node22",
});
