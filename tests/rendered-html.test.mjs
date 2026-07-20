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
  assert.match(page, /SolarSystemCanvas/);
  assert.match(page, /J2000 即時近似位置/);
  assert.match(page, /daysSinceJ2000/);
  assert.match(page, /ORBIT_PREVIEW_DAYS_PER_SECOND = \.45/);
  assert.match(page, /1P \/ HALLEY/);
  assert.match(page, /halleyComet\.eccentricity/);
  assert.match(page, /const solarMoons/);
  assert.match(page, /木衛二/);
  assert.match(page, /selectedMoon\.bioScore/);
  assert.match(page, /REAL-TIME EPHEMERIS/);
  assert.doesNotMatch(page, /setLineDash\(\[5, 7\]\)/);
  assert.match(page, /bioPrediction/);
  assert.match(page, /OWNER ACCESS/);
  assert.match(css, /\.orbit-canvas/);
  assert.match(css, /\.solar-canvas/);
  assert.match(css, /\.comet-orb/);
  assert.match(css, /\.speed-switch/);
  assert.match(css, /\.moon-picker/);
  assert.match(css, /\.moon-orb/);
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

test("publishes a directory of official global astronomy organizations", async () => {
  const [page, resources, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/resources/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /href="\/resources"/);
  assert.match(resources, /NASA/);
  assert.match(resources, /https:\/\/science\.nasa\.gov\/universe\//);
  assert.match(resources, /https:\/\/www\.iau\.org\//);
  assert.match(resources, /https:\/\/www\.asiaa\.sinica\.edu\.tw\//);
  assert.match(resources, /target="_blank"/);
  assert.match(resources, /rel="noreferrer noopener"/);
  assert.match(css, /\.resource-grid/);
});

test("ships the social preview and no ChatGPT authentication helper", async () => {
  await access(new URL("../public/og-v2.png", import.meta.url));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});
