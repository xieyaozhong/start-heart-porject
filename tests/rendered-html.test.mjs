import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("defines the NOCTUA observatory experience", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /NOCTUA｜暗夜天體觀測台/);
  assert.match(page, /從看不見的擾動/);
  assert.match(page, /推演實驗室/);
  assert.match(page, /紀念命名/);
  assert.match(page, /<SkyMap/);
  assert.match(css, /\.sky-canvas/);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|react-loading-skeleton/);
});

test("ships the bespoke social preview and removes starter preview files", async () => {
  await access(new URL("../public/og.png", import.meta.url));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
