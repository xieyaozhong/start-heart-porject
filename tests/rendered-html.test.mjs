import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("defines the live public observatory and owner experience", async () => {
  const [page, layout, css, experience] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/experience.css", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /NOCTUA/);
  assert.match(page, /OrbitCanvas/);
  assert.match(page, /SolarSystemCanvas/);
  assert.match(page, /J2000 REAL-TIME APPROXIMATION/);
  assert.match(page, /daysSinceJ2000/);
  assert.match(page, /ORBIT_PREVIEW_DAYS_PER_SECOND = \.45/);
  assert.match(page, /1P \/ HALLEY/);
  assert.match(page, /halleyComet\.eccentricity/);
  assert.match(page, /const solarMoons/);
  assert.match(page, /Europa/);
  assert.match(page, /selectedMoon\.bioScore/);
  assert.match(page, /Live ephemeris position/);
  assert.doesNotMatch(page, /setLineDash\(\[5, 7\]\)/);
  assert.match(page, /bioPrediction/);
  assert.match(page, /HOLDER ACCESS/);
  assert.match(css, /\.orbit-canvas/);
  assert.match(css, /\.solar-canvas/);
  assert.match(css, /\.comet-orb/);
  assert.match(css, /\.speed-switch/);
  assert.match(css, /\.moon-picker/);
  assert.match(css, /\.moon-orb/);
  assert.match(experience, /\.observatory-credibility/);
  assert.match(experience, /:focus-visible/);
  assert.match(experience, /prefers-reduced-motion/);
  assert.match(layout, /<html lang="en">/);
  assert.match(layout, /og-v5\.png/);
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

test("keeps every customer-facing interface in English", async () => {
  const files = await Promise.all([
    "../app/page.tsx",
    "../app/resources/page.tsx",
    "../app/guide/page.tsx",
    "../app/payment/result/page.tsx",
    "../app/layout.tsx",
    "../app/components/CelestialExplorer3D.tsx",
    "../app/api/orders/route.ts",
    "../app/api/orders/status/route.ts",
    "../app/api/payments/ecpay/checkout/route.ts",
    "../app/api/public/registry/route.ts",
    "../app/api/public/systems/route.ts",
    "../lib/ecpay.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.doesNotMatch(files.join("\n"), /[\p{Script=Han}]/u);
});

test("explains discovery, one-life gifting, continued research, and local sky windows", async () => {
  const [guide, page, resources, orderRoute, schema, migration, universe, admin, adminRoute] = await Promise.all([
    readFile(new URL("../app/guide/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/resources/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_public_bruce_banner.sql", import.meta.url), "utf8"),
    readFile(new URL("../lib/universe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/control/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(guide, /Each purchaser email may complete one NOCTUA registry in a lifetime/);
  assert.match(guide, /calculateSkyWindow/);
  assert.match(guide, /navigator\.geolocation/);
  assert.match(guide, /model-derived and may be too faint or unconfirmed/);
  assert.match(orderRoute, /LIFETIME_LIMIT_REACHED/);
  assert.match(orderRoute, /notInArray/);
  assert.match(orderRoute, /recipientEmail/);
  assert.match(schema, /researchUpdates/);
  assert.match(migration, /CREATE TABLE `research_updates`/);
  assert.match(migration, /`purchaser_name`/);
  assert.match(universe, /publishResearchUpdate/);
  assert.match(admin, /publish_update/);
  assert.match(adminRoute, /publishResearchUpdate/);
  assert.doesNotMatch(page, /href="\/admin"/);
  assert.doesNotMatch(resources, /href="\/admin"/);
});

test("seeds and exposes a one-click demo holder account", async () => {
  const [page, universe, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/universe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /DEMO_OWNER_REGISTRY_CODE = "NOR-DEMO2026"/);
  assert.match(page, /openDemoRegistry/);
  assert.match(page, /OPEN DEMO SYSTEM/);
  assert.match(universe, /id: "ORD-DEMO-OWNER"/);
  assert.match(universe, /registryCode: "NOR-DEMO2026"/);
  assert.match(universe, /namingOrders\)\.values\(demoOwnerOrder\)\.onConflictDoNothing/);
  assert.match(css, /\.demo-owner-account/);
});

test("publishes fifty transparent showcase registries and speculative life morphology", async () => {
  const [page, universe, explorer, experience] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/universe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CelestialExplorer3D.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/experience.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /PUBLIC REGISTRY SHOWCASE \/ 50 RECORDS/);
  assert.match(page, /not claims of real customer payments/);
  assert.match(page, /FULL DESIGNATION/);
  assert.match(page, /SPECULATIVE LIFE MORPHOLOGY/);
  assert.match(universe, /"Our Quiet Cosmos"/);
  const showcaseBlock = universe.match(/const showcaseNames = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.equal(showcaseBlock.match(/"[^"]+"/g)?.length, 50);
  assert.match(universe, /fish-person-like/);
  assert.match(universe, /xenomorph-like/);
  assert.match(universe, /registryShowcase/);
  assert.match(explorer, /explorer-model-code/);
  assert.match(experience, /\.registry-showcase-grid/);
});

test("ships the immersive WebGL celestial explorer", async () => {
  const [page, explorer, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CelestialExplorer3D.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /CelestialExplorer3D/);
  assert.match(page, /import CelestialExplorer3D from/);
  assert.match(page, /OPEN 3D VIEW/);
  assert.match(page, /OPEN PRIVATE SYSTEM IN 3D/);
  assert.match(explorer, /OrbitControls/);
  assert.match(explorer, /WebGLRenderer/);
  assert.match(explorer, /HABITABLE ZONE/);
  assert.match(explorer, /DRAG TO ROTATE/);
  assert.match(explorer, /webglcontextlost/);
  assert.match(explorer, /INITIALISING VERIFIED 3D MODEL/);
  assert.match(explorer, /targetFrameMs = lowPower \? 1000 \/ 30 : 1000 \/ 50/);
  assert.match(explorer, /systemMeshesRef/);
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /devicePixelRatio \|\| 1, 1\.35/);
  assert.match(css, /\.celestial-explorer/);
  assert.match(packageJson, /"three"/);
});

test("integrates signed ECPay checkout and verified payment callbacks", async () => {
  const [page, orderRoute, checkout, notify, gateway, schema, migration, resultPage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payments/ecpay/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payments/ecpay/notify/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/ecpay.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_chemical_network.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/payment/result/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /<b>ECPay<\/b>/);
  assert.match(page, /window\.location\.assign\(data\.checkoutUrl\)/);
  assert.doesNotMatch(page, /name="card|credit card number|security code/i);
  assert.match(orderRoute, /paymentTradeNo/);
  assert.match(orderRoute, /paymentToken/);
  assert.match(checkout, /method=\"post\"/);
  assert.match(checkout, /CONTINUE TO ECPAY/);
  assert.doesNotMatch(checkout, /getElementById\('ecpay'\)\.submit/);
  assert.match(gateway, /payment-stage\.ecpay\.com\.tw/);
  assert.match(notify, /"1\|OK"/);
  assert.match(gateway, /SHA-256/);
  assert.match(gateway, /expected !== values\.CheckMacValue/);
  assert.match(gateway, /Number\(values\.TradeAmt\) === order\.amountTwd/);
  assert.match(gateway, /status = "test_paid"/);
  assert.match(schema, /paymentTradeId/);
  assert.match(migration, /naming_orders_payment_trade_no_unique/);
  assert.match(resultPage, /simulated transaction/);
});

test("matches ECPay's official SHA-256 CheckMacValue vector", () => {
  const parameters = { TradeDesc: "促銷方案", PaymentType: "aio", MerchantTradeDate: "2023/03/12 15:30:23", MerchantTradeNo: "ecpay20230312153023", MerchantID: "3002607", ReturnURL: "https://www.ecpay.com.tw/receive.php", ItemName: "Apple iphone 15", TotalAmount: "30000", ChoosePayment: "ALL", EncryptType: "1" };
  const content = Object.keys(parameters).sort((left, right) => left.toLowerCase().localeCompare(right.toLowerCase())).map((key) => `${key}=${parameters[key]}`).join("&");
  const encoded = encodeURIComponent(`HashKey=pwFHCqoQZGmho4w6&${content}&HashIV=EkRm7iFT261dpevs`).replace(/%20/g, "+").replace(/~/g, "%7E").replace(/'/g, "%27").toLowerCase();
  const actual = createHash("sha256").update(encoded).digest("hex").toUpperCase();
  assert.equal(actual, "6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840");
});

test("ships the social preview and no ChatGPT authentication helper", async () => {
  await access(new URL("../public/og-v5.png", import.meta.url));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});
