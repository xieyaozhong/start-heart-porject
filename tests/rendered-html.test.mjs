import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("defines the live public observatory and owner experience", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /NOCTUA/);
  assert.match(page, /OrbitCanvas/);
  assert.match(page, /REAL-TIME EPHEMERIS/);
  assert.match(page, /bioPrediction/);
  assert.match(page, /OWNER ACCESS/);
  assert.match(css, /\.orbit-canvas/);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|react-loading-skeleton/);
});

test("defines protected administration and scheduled inference", async () => {
  const [admin, auth, cron, schema, workflow] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/cron/infer/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/scheduled-inference.yml", import.meta.url), "utf8"),
  ]);
  assert.match(admin, /run_inference/);
  assert.match(admin, /save_package/);
  assert.match(auth, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(cron, /runInference/);
  assert.match(schema, /starSystems/);
  assert.match(workflow, /NOCTUA_CRON_SECRET/);
});

test("ships the social preview and no ChatGPT authentication helper", async () => {
  await access(new URL("../public/og-v2.png", import.meta.url));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});
