import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inferenceRuns, namingOrders, namingPackages, planets, researchUpdates, starSystems, systemSettings } from "@/db/schema";
import { getPaymentPublicInfo } from "@/lib/ecpay";

export type Composition = { label: string; value: number; color: string };

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const initialSystems = [
  {
    system: { id: "SYS-NX-001", designation: "NOCTUA-X1", displayName: null, classification: "G8V 黃矮星", raHours: 19.8464, decDeg: 8.8683, distancePc: 47.2, starMass: 0.91, starRadius: 0.94, temperatureK: 5480, luminosity: 0.72, ageByr: 5.1, metallicity: 0.08, status: "published", confidence: 86, summary: "徑向速度與凌日訊號交叉吻合的四行星候選系統。", epochAt: "2026-07-19T00:00:00.000Z", publishedAt: "2026-07-19T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-001-B", code: "NOCTUA-X1 b", type: "熔岩岩質行星", massEarth: 1.7, radiusEarth: 1.19, periodDays: 8.42, semiMajorAu: 0.078, eccentricity: 0.03, equilibriumTemp: 982, epochAngleDeg: 34, orbitColor: "#d46b3c", composition: [{ label: "矽酸鹽", value: 61, color: "#d97848" }, { label: "鐵鎳核心", value: 34, color: "#a8a9a7" }, { label: "其他", value: 5, color: "#617682" }], atmosphere: "極稀薄鈉、氧外逸層", state: "潮汐鎖定 · 強烈火山活動", bioScore: 1, bioPrediction: "表面溫度過高，已知型態生命可能性極低。" },
      { id: "PL-NX-001-C", code: "NOCTUA-X1 c", type: "溫暖超級地球", massEarth: 4.8, radiusEarth: 1.73, periodDays: 46.2, semiMajorAu: 0.244, eccentricity: 0.07, equilibriumTemp: 421, epochAngleDeg: 158, orbitColor: "#dfaa62", composition: [{ label: "岩石地函", value: 58, color: "#c58b5d" }, { label: "金屬核心", value: 26, color: "#a8a9a7" }, { label: "水／冰", value: 16, color: "#6d9ec7" }], atmosphere: "氮、二氧化碳、水氣候選", state: "高壓溫室 · 可能有季節循環", bioScore: 22, bioPrediction: "高層雲帶可能存在溫和區，但尚無直接生物標記。" },
      { id: "PL-NX-001-D", code: "NOCTUA-X1 d", type: "宜居帶海洋候選體", massEarth: 2.3, radiusEarth: 1.34, periodDays: 126.4, semiMajorAu: 0.478, eccentricity: 0.12, equilibriumTemp: 286, epochAngleDeg: 242, orbitColor: "#72b6c9", composition: [{ label: "矽酸鹽", value: 43, color: "#bd8b63" }, { label: "水／冰", value: 39, color: "#6ab6d5" }, { label: "鐵鎳", value: 18, color: "#a8a9a7" }], atmosphere: "氮、水氣、微量甲烷候選", state: "液態水條件可能 · 模型穩定", bioScore: 61, bioPrediction: "具有液態水與能量梯度條件；生物可能性為中等，需光譜確認。" },
      { id: "PL-NX-001-E", code: "NOCTUA-X1 e", type: "冰冷氣態巨行星", massEarth: 128, radiusEarth: 9.2, periodDays: 682, semiMajorAu: 1.47, eccentricity: 0.19, equilibriumTemp: 163, epochAngleDeg: 306, orbitColor: "#9c8fc4", composition: [{ label: "氫氦", value: 79, color: "#d3c6a4" }, { label: "冰質物", value: 16, color: "#87a9c5" }, { label: "重元素", value: 5, color: "#9a826f" }], atmosphere: "氫、氦、甲烷", state: "外層雲帶穩定 · 可能有大型衛星", bioScore: 8, bioPrediction: "行星本體不適居；衛星可能具有地下海洋環境。" },
    ],
  },
  {
    system: { id: "SYS-NX-014", designation: "NOCTUA-K14", displayName: null, classification: "K4V 橙矮星", raHours: 5.2351, decDeg: -8.201, distancePc: 83.7, starMass: 0.71, starRadius: 0.74, temperatureK: 4510, luminosity: 0.23, ageByr: 7.8, metallicity: -0.04, status: "published", confidence: 78, summary: "低溫母恆星周圍的緊密三行星候選系統。", epochAt: "2026-07-18T00:00:00.000Z", publishedAt: "2026-07-18T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-014-B", code: "NOCTUA-K14 b", type: "高溫超級地球", massEarth: 6.1, radiusEarth: 1.86, periodDays: 18.6, semiMajorAu: 0.122, eccentricity: 0.04, equilibriumTemp: 622, epochAngleDeg: 77, orbitColor: "#d77b55", composition: [{ label: "岩石", value: 59, color: "#c98963" }, { label: "鐵鎳", value: 28, color: "#a8a9a7" }, { label: "揮發物", value: 13, color: "#78a9bf" }], atmosphere: "高分子量大氣候選", state: "高溫 · 受恆星活動影響", bioScore: 5, bioPrediction: "表面環境嚴苛，已知生命條件不足。" },
      { id: "PL-NX-014-C", code: "NOCTUA-K14 c", type: "溫帶迷你海王星", massEarth: 10.4, radiusEarth: 2.91, periodDays: 72.8, semiMajorAu: 0.305, eccentricity: 0.08, equilibriumTemp: 332, epochAngleDeg: 201, orbitColor: "#68a9bd", composition: [{ label: "氫氦", value: 37, color: "#d9cbb2" }, { label: "水／冰", value: 42, color: "#6caac8" }, { label: "岩石", value: 21, color: "#a77859" }], atmosphere: "氫、氦、水氣", state: "厚重大氣 · 深層超臨界海洋可能", bioScore: 18, bioPrediction: "大氣層過厚；上層雲區化學環境值得後續觀測。" },
      { id: "PL-NX-014-D", code: "NOCTUA-K14 d", type: "冰質類海王星", massEarth: 18.7, radiusEarth: 3.72, periodDays: 311, semiMajorAu: 0.803, eccentricity: 0.15, equilibriumTemp: 204, epochAngleDeg: 312, orbitColor: "#817db5", composition: [{ label: "水／冰", value: 56, color: "#86a9c4" }, { label: "氫氦", value: 31, color: "#d2cbbd" }, { label: "岩石", value: 13, color: "#8e6f5c" }], atmosphere: "氫、氦、甲烷", state: "寒冷 · 高空甲烷霧", bioScore: 4, bioPrediction: "能量來源有限，生命可能性偏低。" },
    ],
  },
];

const defaultPackages = [
  { id: "PKG-EXPLORER", name: "探索者", priceTwd: 680, description: "一顆行星的私人紀念登錄", featuresJson: JSON.stringify(["數位命名證書", "即時軌道動畫", "專屬行星編號"]), active: true, sortOrder: 1 },
  { id: "PKG-OBSERVER", name: "觀測者", priceTwd: 1280, description: "恆星與完整行星體系登錄", featuresJson: JSON.stringify(["恆星體系專屬編號", "4K 星系動畫", "年度位置更新"]), active: true, sortOrder: 2 },
  { id: "PKG-ARCHIVIST", name: "典藏者", priceTwd: 2680, description: "完整典藏檔案與客製動畫", featuresJson: JSON.stringify(["可列印典藏證書", "客製獻詞", "完整軌道與成分報告"]), active: true, sortOrder: 3 },
];

const demoOwnerOrder = {
  id: "ORD-DEMO-OWNER",
  createdAt: "2026-07-19T08:00:00.000Z",
  candidateId: "SYS-NX-001",
  systemId: "SYS-NX-001",
  planetId: "PL-NX-001-D",
  desiredName: "Asteria Noctua",
  purchaserName: "Orion Vale",
  ownerName: "星願示範者",
  recipientEmail: "asteria-recipient@noctua.example",
  dedication: "願每一次仰望，都能找到屬於自己的光。",
  email: "demo-owner@noctua.example",
  packageName: "觀測者",
  amountTwd: 1280,
  status: "confirmed",
  registryCode: "NOR-DEMO2026",
  animationTheme: "amber",
  confirmedAt: "2026-07-19T08:05:00.000Z",
};

const initialResearchUpdates = [
  { id: "UPD-NX-001-01", systemId: "SYS-NX-001", title: "Atmospheric model refined", summary: "A revised thermal model narrows the likely water-vapour range for NOCTUA-X1 d while preserving its status as the system’s strongest temperate candidate.", observingNote: "Best inspected in the holder sky guide near meridian transit; the coordinates remain model-derived and are not a confirmed telescope target.", symbolicMeaning: "A symbol of patient hope: something distant becoming clearer through sustained attention.", publishedAt: "2026-07-19T10:00:00.000Z" },
  { id: "UPD-NX-014-01", systemId: "SYS-NX-014", title: "Orbital solution stabilised", summary: "Additional synthetic sampling reduced uncertainty in the three-planet orbital configuration around NOCTUA-K14.", observingNote: "Use the live guide to calculate the next local meridian window from the model right ascension and declination.", symbolicMeaning: "A symbol of constancy and quiet devotion around a long-lived star.", publishedAt: "2026-07-18T10:00:00.000Z" },
];

export async function ensureUniverseSeeded() {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(starSystems);
  if (total === 0) {
    for (const item of initialSystems) {
      await db.insert(starSystems).values(item.system);
      await db.insert(planets).values(item.planets.map((planet) => {
        const { composition, ...planetData } = planet;
        return { ...planetData, systemId: item.system.id, displayName: null, compositionJson: JSON.stringify(composition) };
      }));
    }
  }
  const [{ packageTotal }] = await db.select({ packageTotal: count() }).from(namingPackages);
  if (packageTotal === 0) await db.insert(namingPackages).values(defaultPackages);
  await db.insert(namingOrders).values(demoOwnerOrder).onConflictDoNothing();
  for (const update of initialResearchUpdates) await db.insert(researchUpdates).values(update).onConflictDoNothing();
  const settings = [
    { key: "schedule_frequency", value: "daily" },
    { key: "auto_publish", value: "false" },
    { key: "schedule_enabled", value: "true" },
  ];
  for (const setting of settings) await db.insert(systemSettings).values(setting).onConflictDoNothing();
}

async function hydrateSystems<T extends { id: string }>(rows: T[]) {
  const db = getDb();
  const planetRows = await db.select().from(planets).orderBy(asc(planets.semiMajorAu));
  return rows.map((system) => ({
    ...system,
    planets: planetRows.filter((planet) => planet.systemId === system.id).map((planet) => ({ ...planet, composition: parseJson<Composition[]>(planet.compositionJson, []) })),
  }));
}

type HydratedPlanet = typeof planets.$inferSelect & { composition: Composition[] };
type HydratedSystem = typeof starSystems.$inferSelect & { planets: HydratedPlanet[] };

const compositionLabels: Record<string, string> = {
  "矽酸鹽": "Silicates", "鐵鎳核心": "Iron–nickel core", "其他": "Other", "岩石地函": "Rocky mantle",
  "金屬核心": "Metallic core", "水／冰": "Water / ice", "鐵鎳": "Iron–nickel", "氫氦": "Hydrogen / helium",
  "冰質物": "Ices", "重元素": "Heavy elements", "岩石": "Rock", "揮發物": "Volatiles",
};

function publicPlanet(planet: HydratedPlanet) {
  const hot = planet.equilibriumTemp > 500;
  const temperate = planet.equilibriumTemp >= 240 && planet.equilibriumTemp <= 330;
  const giant = planet.massEarth > 55;
  const subNeptune = planet.massEarth > 9 && !giant;
  const waterRich = planet.composition.some((item) => /水|ice|water/i.test(item.label) && item.value >= 30);
  const type = giant ? (hot ? "Hot gas giant" : "Cold gas giant") : subNeptune ? (temperate ? "Temperate mini-Neptune" : "Ice-rich sub-Neptune") : waterRich && temperate ? "Habitable-zone ocean candidate" : hot ? (planet.massEarth > 2.2 ? "Hot super-Earth" : "Lava terrestrial planet") : planet.massEarth > 2.2 ? "Super-Earth" : "Terrestrial planet";
  const atmosphere = giant || subNeptune ? "Candidate hydrogen, helium and trace methane" : temperate ? "Candidate nitrogen, water vapour and trace carbon dioxide" : hot ? "Thin, high-temperature mineral exosphere candidate" : "Thin carbon-dioxide atmosphere candidate";
  const state = giant ? "Active cloud bands · large moons possible" : subNeptune ? "Deep atmosphere · high-pressure interior" : temperate ? "Within the model habitable zone" : hot ? "Irradiated surface · possible tidal locking" : "Cold, dry surface conditions";
  const bioPrediction = planet.bioScore >= 45 ? "The model permits liquid-water conditions and usable energy gradients; spectroscopy is required to test for biosignatures." : planet.bioScore >= 12 ? "Atmospheric chemistry merits follow-up observation, although surface habitability remains uncertain." : giant ? "The planet itself is inhospitable; large moons could preserve subsurface oceans." : "Current conditions are insufficient for known forms of life.";
  return { ...planet, type, atmosphere, state, bioPrediction, composition: planet.composition.map((item) => ({ ...item, label: compositionLabels[item.label] ?? (/^[\x00-\x7F]*$/.test(item.label) ? item.label : "Estimated material") })) };
}

function publicSystem(system: HydratedSystem) {
  const classification = system.temperatureK >= 6000 ? "F-type main-sequence star" : system.temperatureK >= 5200 ? "G-type main-sequence star" : "K-type orange dwarf";
  return { ...system, classification, summary: `A ${system.planets.length}-planet candidate system inferred from converging periodic signals and awaiting independent observational confirmation.`, planets: system.planets.map(publicPlanet) };
}

const englishPackages: Record<string, { name: string; description: string; features: string[] }> = {
  "PKG-EXPLORER": { name: "Explorer", description: "A private memorial registry for one candidate planet", features: ["Digital naming certificate", "Live orbital animation", "Unique planetary designation"] },
  "PKG-OBSERVER": { name: "Observer", description: "A star and its complete candidate planetary system", features: ["Unique stellar-system registry", "4K system animation", "Annual position update"] },
  "PKG-ARCHIVIST": { name: "Archivist", description: "A complete archival record with bespoke presentation", features: ["Print-ready archival certificate", "Custom dedication", "Full orbit and composition report"] },
};

function publicPackage<T extends { id: string; name: string; description: string; featuresJson: string }>(item: T) {
  const translated = englishPackages[item.id];
  const rawFeatures = parseJson<string[]>(item.featuresJson, []);
  return { ...item, name: translated?.name ?? (/^[\x00-\x7F]*$/.test(item.name) ? item.name : "Celestial Registry"), description: translated?.description ?? (/^[\x00-\x7F]*$/.test(item.description) ? item.description : "A personalised private celestial registry edition"), features: translated?.features ?? rawFeatures.map((feature) => /^[\x00-\x7F]*$/.test(feature) ? feature : "Personalised archival deliverable") };
}

export async function getPublicUniverse() {
  await ensureUniverseSeeded();
  const db = getDb();
  const systems = await db.select().from(starSystems).where(eq(starSystems.status, "published")).orderBy(desc(starSystems.publishedAt));
  const packages = await db.select().from(namingPackages).where(eq(namingPackages.active, true)).orderBy(asc(namingPackages.sortOrder));
  return { systems: (await hydrateSystems(systems)).map(publicSystem), packages: packages.map(publicPackage) };
}

function planetProfile(semiMajorAu: number, massEarth: number, starLuminosity: number) {
  const temp = Math.round(278 * Math.pow(starLuminosity, 0.25) / Math.sqrt(2 * semiMajorAu));
  if (massEarth > 55) return { type: temp > 500 ? "高溫氣態巨行星" : "氣態巨行星", radius: 8 + Math.min(3, massEarth / 80), composition: [{ label: "氫氦", value: 82, color: "#d6cab5" }, { label: "冰質物", value: 12, color: "#7ba4c0" }, { label: "重元素", value: 6, color: "#92745f" }], atmosphere: "氫、氦、甲烷候選", state: temp > 500 ? "受強烈輻射加熱" : "雲帶與風暴活動", bioScore: 3, bio: "行星本體不適居；大型衛星仍值得觀測。", temp };
  if (massEarth > 9) return { type: "迷你海王星", radius: 2.4 + massEarth / 18, composition: [{ label: "水／冰", value: 44, color: "#76a9c6" }, { label: "氫氦", value: 34, color: "#d7ccba" }, { label: "岩石", value: 22, color: "#a87d60" }], atmosphere: "氫、氦、水氣候選", state: "厚重大氣 · 高壓內部", bioScore: temp > 240 && temp < 390 ? 16 : 4, bio: "雲層化學可觀測，但固態宜居表面可能性低。", temp };
  const temperate = temp > 240 && temp < 360;
  return { type: massEarth > 2.2 ? "超級地球" : "岩質行星", radius: Math.pow(massEarth, 0.27), composition: [{ label: "矽酸鹽", value: 59, color: "#c38660" }, { label: "鐵鎳", value: 28, color: "#a7aaa9" }, { label: "水／揮發物", value: 13, color: "#70a6c3" }], atmosphere: temperate ? "氮、水氣候選" : "稀薄二氧化碳候選", state: temperate ? "位於模型宜居帶" : temp > 500 ? "高溫表面" : "寒冷乾燥", bioScore: temperate ? 48 : 6, bio: temperate ? "具液態水溫度條件，生物標記仍需光譜確認。" : "目前環境條件不足以支持已知型態生命。", temp };
}

export async function runInference(source: "admin" | "schedule") {
  await ensureUniverseSeeded();
  const db = getDb();
  const seed = Date.now();
  const random = seededRandom(seed);
  const systemId = `SYS-NX-${seed.toString(36).toUpperCase().slice(-7)}`;
  const designation = `NOCTUA-${String(Math.floor(random() * 9999)).padStart(4, "0")}`;
  const starMass = 0.62 + random() * 0.68;
  const luminosity = Math.pow(starMass, 3.5);
  const temperatureK = Math.round(3900 + starMass * 1900);
  const settings = await db.select().from(systemSettings);
  const autoPublish = settings.find((setting) => setting.key === "auto_publish")?.value === "true";
  const now = new Date().toISOString();
  const status = autoPublish ? "published" : "candidate";
  const runId = `RUN-${seed.toString(36).toUpperCase()}`;
  await db.insert(inferenceRuns).values({ id: runId, source, status: "running", notes: "基於徑向速度與凌日殘差的合成候選解。", startedAt: now });
  await db.insert(starSystems).values({
    id: systemId, designation, displayName: null, classification: temperatureK > 5700 ? "F/G 型主序星" : temperatureK > 4900 ? "G/K 型主序星" : "K 型橙矮星",
    raHours: random() * 24, decDeg: -58 + random() * 116, distancePc: 28 + random() * 190, starMass, starRadius: starMass * (0.92 + random() * 0.12), temperatureK, luminosity,
    ageByr: 1.8 + random() * 8, metallicity: -0.2 + random() * 0.45, status, confidence: Math.round(67 + random() * 25),
    summary: "排程模型由多週期訊號殘差推導出的新候選恆星系統，等待後續觀測驗證。", epochAt: now, publishedAt: autoPublish ? now : null,
  });
  const planetCount = 2 + Math.floor(random() * 4);
  let period = 9 + random() * 12;
  const colors = ["#d06f47", "#d6a35e", "#72b5c8", "#8b82bd", "#ad7a9f"];
  for (let index = 0; index < planetCount; index += 1) {
    period *= 2.1 + random() * 1.3;
    const semiMajorAu = Math.cbrt(starMass * Math.pow(period / 365.25, 2));
    const massEarth = index < 2 ? 0.7 + random() * 10 : 8 + random() * 150;
    const profile = planetProfile(semiMajorAu, massEarth, luminosity);
    const letter = String.fromCharCode(98 + index);
    await db.insert(planets).values({
      id: `${systemId}-${letter.toUpperCase()}`, systemId, code: `${designation} ${letter}`, displayName: null, type: profile.type, massEarth,
      radiusEarth: profile.radius, periodDays: period, semiMajorAu, eccentricity: random() * 0.22, equilibriumTemp: profile.temp, epochAngleDeg: random() * 360,
      orbitColor: colors[index % colors.length], compositionJson: JSON.stringify(profile.composition), atmosphere: profile.atmosphere, state: profile.state,
      bioScore: profile.bioScore, bioPrediction: profile.bio,
    });
  }
  await db.update(inferenceRuns).set({ status: "completed", generatedSystemId: systemId, finishedAt: new Date().toISOString() }).where(eq(inferenceRuns.id, runId));
  return (await hydrateSystems(await db.select().from(starSystems).where(eq(starSystems.id, systemId))))[0];
}

export async function getAdminDashboard() {
  await ensureUniverseSeeded();
  const db = getDb();
  const [systems, packages, orders, runs, settings, updates] = await Promise.all([
    db.select().from(starSystems).orderBy(desc(starSystems.createdAt)),
    db.select().from(namingPackages).orderBy(asc(namingPackages.sortOrder)),
    db.select().from(namingOrders).orderBy(desc(namingOrders.createdAt)).limit(50),
    db.select().from(inferenceRuns).orderBy(desc(inferenceRuns.startedAt)).limit(20),
    db.select().from(systemSettings),
    db.select().from(researchUpdates).orderBy(desc(researchUpdates.publishedAt)).limit(40),
  ]);
  return { systems: await hydrateSystems(systems), packages: packages.map((item) => ({ ...item, features: parseJson<string[]>(item.featuresJson, []) })), orders, runs, updates, settings: Object.fromEntries(settings.map((item) => [item.key, item.value])), payment: getPaymentPublicInfo() };
}

export async function publishResearchUpdate(payload: { systemId: string; title: string; summary: string; observingNote: string; symbolicMeaning: string }) {
  const db = getDb();
  const [system] = await db.select({ id: starSystems.id }).from(starSystems).where(eq(starSystems.id, payload.systemId));
  if (!system) throw new Error("找不到要更新的星系");
  if (!payload.title.trim() || !payload.summary.trim() || !payload.observingNote.trim() || !payload.symbolicMeaning.trim()) throw new Error("研究進展資料不完整");
  const update = {
    id: `UPD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    systemId: system.id,
    title: payload.title.trim().slice(0, 100),
    summary: payload.summary.trim().slice(0, 600),
    observingNote: payload.observingNote.trim().slice(0, 400),
    symbolicMeaning: payload.symbolicMeaning.trim().slice(0, 400),
    publishedAt: new Date().toISOString(),
  };
  await db.insert(researchUpdates).values(update);
  return update;
}

export async function publishSystem(id: string, published: boolean) {
  const db = getDb();
  await db.update(starSystems).set({ status: published ? "published" : "candidate", publishedAt: published ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }).where(eq(starSystems.id, id));
}

export async function saveSchedule(frequency: string, enabled: boolean, autoPublish: boolean) {
  const db = getDb();
  const values = [{ key: "schedule_frequency", value: frequency }, { key: "schedule_enabled", value: String(enabled) }, { key: "auto_publish", value: String(autoPublish) }];
  for (const item of values) await db.insert(systemSettings).values(item).onConflictDoUpdate({ target: systemSettings.key, set: { value: item.value, updatedAt: new Date().toISOString() } });
}

export async function savePackage(payload: { id?: string; name: string; priceTwd: number; description: string; features: string[]; active: boolean }) {
  const db = getDb();
  const id = payload.id || `PKG-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(namingPackages).values({ id, name: payload.name, priceTwd: payload.priceTwd, description: payload.description, featuresJson: JSON.stringify(payload.features), active: payload.active, sortOrder: Date.now() % 100000 }).onConflictDoUpdate({ target: namingPackages.id, set: { name: payload.name, priceTwd: payload.priceTwd, description: payload.description, featuresJson: JSON.stringify(payload.features), active: payload.active, updatedAt: new Date().toISOString() } });
}

export async function approveOrder(id: string) {
  const db = getDb();
  const [order] = await db.select().from(namingOrders).where(eq(namingOrders.id, id));
  if (!order) throw new Error("找不到訂單");
  const registryCode = order.registryCode ?? `NOR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db.update(namingOrders).set({ status: "confirmed", registryCode, confirmedAt: new Date().toISOString() }).where(eq(namingOrders.id, id));
  return registryCode;
}

export async function findRegistry(code: string) {
  await ensureUniverseSeeded();
  const db = getDb();
  const [order] = await db.select().from(namingOrders).where(and(eq(namingOrders.registryCode, code.toUpperCase()), eq(namingOrders.status, "confirmed")));
  if (!order?.systemId) return null;
  const [system] = await db.select().from(starSystems).where(eq(starSystems.id, order.systemId));
  if (!system) return null;
  const [hydrated] = await hydrateSystems([system]);
  const updates = await db.select().from(researchUpdates).where(eq(researchUpdates.systemId, system.id)).orderBy(desc(researchUpdates.publishedAt));
  const packageName = ({ "探索者": "Explorer", "觀測者": "Observer", "典藏者": "Archivist" } as Record<string, string>)[order.packageName] ?? order.packageName;
  const publicOrder = order.id === demoOwnerOrder.id
    ? { registryCode: order.registryCode!, desiredName: order.desiredName, ownerName: "Starlight Demo Holder", purchaserName: "Orion Vale", dedication: "May every upward glance reveal a light that belongs to you.", packageName: "Observer" }
    : { registryCode: order.registryCode!, desiredName: order.desiredName, ownerName: order.ownerName ?? "Registry holder", purchaserName: order.purchaserName ?? "A private giver", dedication: order.dedication ?? "", packageName };
  return { order: publicOrder, system: publicSystem(hydrated), updates };
}
