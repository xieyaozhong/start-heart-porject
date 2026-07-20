import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("seeds and exposes a one-click demo holder account", async () => {
  const [page, universe, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/universe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /DEMO_OWNER_REGISTRY_CODE = "NOR-DEMO2026"/);
  assert.match(page, /openDemoRegistry/);
  assert.match(page, /一鍵開啟範例星系/);
  assert.match(universe, /id: "ORD-DEMO-OWNER"/);
  assert.match(universe, /registryCode: "NOR-DEMO2026"/);
  assert.match(universe, /namingOrders\)\.values\(demoOwnerOrder\)\.onConflictDoNothing/);
  assert.match(css, /\.demo-owner-account/);
});

test("ships the immersive WebGL celestial explorer", async () => {
  const [page, explorer, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CelestialExplorer3D.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /CelestialExplorer3D/);
  assert.match(page, /開啟 3D VIEW/);
  assert.match(page, /開啟 3D 專屬星系/);
  assert.match(explorer, /OrbitControls/);
  assert.match(explorer, /WebGLRenderer/);
  assert.match(explorer, /宜居帶/);
  assert.match(explorer, /拖曳旋轉/);
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
  assert.match(page, /ECPay 綠界科技/);
  assert.match(page, /window\.location\.assign\(data\.checkoutUrl\)/);
  assert.doesNotMatch(page, /name="card|信用卡卡號|安全碼/);
  assert.match(orderRoute, /paymentTradeNo/);
  assert.match(orderRoute, /paymentToken/);
  assert.match(checkout, /method=\"post\"/);
  assert.match(gateway, /payment-stage\.ecpay\.com\.tw/);
  assert.match(notify, /"1\|OK"/);
  assert.match(gateway, /SHA-256/);
  assert.match(gateway, /expected !== values\.CheckMacValue/);
  assert.match(gateway, /Number\(values\.TradeAmt\) === order\.amountTwd/);
  assert.match(gateway, /status = "test_paid"/);
  assert.match(schema, /paymentTradeId/);
  assert.match(migration, /naming_orders_payment_trade_no_unique/);
  assert.match(resultPage, /測試交易，未產生扣款/);
});

test("matches ECPay's official SHA-256 CheckMacValue vector", () => {
  const parameters = { TradeDesc: "促銷方案", PaymentType: "aio", MerchantTradeDate: "2023/03/12 15:30:23", MerchantTradeNo: "ecpay20230312153023", MerchantID: "3002607", ReturnURL: "https://www.ecpay.com.tw/receive.php", ItemName: "Apple iphone 15", TotalAmount: "30000", ChoosePayment: "ALL", EncryptType: "1" };
  const content = Object.keys(parameters).sort((left, right) => left.toLowerCase().localeCompare(right.toLowerCase())).map((key) => `${key}=${parameters[key]}`).join("&");
  const encoded = encodeURIComponent(`HashKey=pwFHCqoQZGmho4w6&${content}&HashIV=EkRm7iFT261dpevs`).replace(/%20/g, "+").replace(/~/g, "%7E").replace(/'/g, "%27").toLowerCase();
  const actual = createHash("sha256").update(encoded).digest("hex").toUpperCase();
  assert.equal(actual, "6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840");
});

test("ships the social preview and no ChatGPT authentication helper", async () => {
  await access(new URL("../public/og-v2.png", import.meta.url));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});
