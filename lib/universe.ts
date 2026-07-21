import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inferenceRuns, namingOrders, namingPackages, planets, researchUpdates, starSystems, systemSettings } from "@/db/schema";
import { getPaymentPublicInfo } from "@/lib/ecpay";
import { USD_PRICING_RATE_TWD, usdFromTwd } from "@/lib/pricing";

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

function modelledSkyPosition(sampleIndex: number, distancePc: number, latitudeCompression = 0.62) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const longitude = (sampleIndex * goldenAngle) % (Math.PI * 2);
  const fibonacciZ = 1 - 2 * ((sampleIndex * 0.61803398875) % 1);
  const declination = Math.asin(Math.max(-1, Math.min(1, fibonacciZ))) * latitudeCompression;
  return {
    raHours: Number(((longitude / (Math.PI * 2) * 24 + 24) % 24).toFixed(4)),
    decDeg: Number((declination * 180 / Math.PI).toFixed(4)),
    distancePc,
  };
}

const blueGiantModelPosition = modelledSkyPosition(61, 286.4, .38);
const pulsarModelPosition = modelledSkyPosition(67, 412.8, .56);
const blackHoleModelPosition = modelledSkyPosition(73, 726.5, .42);
const doublePlanetModelPosition = modelledSkyPosition(81, 96.3, .78);
const lilyModelPosition = modelledSkyPosition(89, 72.6, .68);

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
  {
    system: { id: "SYS-NX-BIN-021", designation: "NOCTUA-GEMINI-21", displayName: null, classification: "G2V + K1V binary star system", raHours: 14.4182, decDeg: 19.1864, distancePc: 31.6, starMass: 1.56, starRadius: 1.02, temperatureK: 5840, luminosity: 1.18, ageByr: 4.6, metallicity: 0.03, status: "published", confidence: 82, summary: "A circumbinary three-planet candidate system orbiting a close G-type and K-type stellar pair.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-BIN-021-B", code: "NOCTUA-GEMINI-21 b", type: "Hot circumbinary super-Earth", massEarth: 3.4, radiusEarth: 1.52, periodDays: 24.8, semiMajorAu: 0.18, eccentricity: 0.08, equilibriumTemp: 790, epochAngleDeg: 42, orbitColor: "#df7450", composition: [{ label: "Silicates", value: 57, color: "#c77c58" }, { label: "Metallic core", value: 34, color: "#a8a9a7" }, { label: "Other", value: 9, color: "#617682" }], atmosphere: "Thin mineral and sodium exosphere candidate", state: "Circumbinary orbit · strongly irradiated surface", bioScore: 2, bioPrediction: "Intense irradiation makes known surface life highly unlikely." },
      { id: "PL-NX-BIN-021-C", code: "NOCTUA-GEMINI-21 c", type: "Temperate circumbinary ocean candidate", massEarth: 5.2, radiusEarth: 1.86, periodDays: 189.6, semiMajorAu: 0.78, eccentricity: 0.05, equilibriumTemp: 294, epochAngleDeg: 176, orbitColor: "#55b6c9", composition: [{ label: "Water / ice", value: 41, color: "#65b9d4" }, { label: "Silicates", value: 39, color: "#bd8b63" }, { label: "Iron-nickel core", value: 20, color: "#a8a9a7" }], atmosphere: "Candidate nitrogen, water vapour and trace carbon dioxide", state: "Circumbinary habitable-zone orbit · variable twin-star illumination", bioScore: 57, bioPrediction: "Liquid water may persist, but the changing radiation from two stars requires further climate modelling." },
      { id: "PL-NX-BIN-021-D", code: "NOCTUA-GEMINI-21 d", type: "Cold circumbinary gas giant", massEarth: 146, radiusEarth: 9.6, periodDays: 788, semiMajorAu: 2.05, eccentricity: 0.14, equilibriumTemp: 160, epochAngleDeg: 298, orbitColor: "#a68ec8", composition: [{ label: "Hydrogen / helium", value: 81, color: "#d3c6a4" }, { label: "Ices", value: 14, color: "#87a9c5" }, { label: "Heavy elements", value: 5, color: "#9a826f" }], atmosphere: "Hydrogen, helium and trace methane", state: "Wide circumbinary orbit · large moons possible", bioScore: 7, bioPrediction: "The giant itself is inhospitable; large moons could retain subsurface oceans." },
    ],
  },
  {
    system: { id: "SYS-NX-WD-031", designation: "NOCTUA-CINDER-31", displayName: null, classification: "DA white dwarf remnant", raHours: 9.7524, decDeg: -27.3841, distancePc: 22.4, starMass: 0.62, starRadius: 0.013, temperatureK: 11800, luminosity: 0.012, ageByr: 1.3, metallicity: -0.18, status: "published", confidence: 74, summary: "A compact white-dwarf remnant with two surviving close-orbit planetary candidates.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-WD-031-B", code: "NOCTUA-CINDER-31 b", type: "Scorched carbon-rich terrestrial", massEarth: 1.1, radiusEarth: 0.96, periodDays: 2.8, semiMajorAu: 0.025, eccentricity: 0.03, equilibriumTemp: 1250, epochAngleDeg: 68, orbitColor: "#e98258", composition: [{ label: "Carbon-rich rock", value: 46, color: "#5b5554" }, { label: "Iron-nickel core", value: 38, color: "#a8a9a7" }, { label: "Silicates", value: 16, color: "#bd7f5c" }], atmosphere: "Vaporised mineral exosphere candidate", state: "Tidally locked · irradiated by a compact stellar remnant", bioScore: 0, bioPrediction: "Extreme heat and radiation rule out known surface life." },
      { id: "PL-NX-WD-031-C", code: "NOCTUA-CINDER-31 c", type: "Dense iron-rich remnant planet", massEarth: 2.0, radiusEarth: 1.08, periodDays: 63.4, semiMajorAu: 0.19, eccentricity: 0.11, equilibriumTemp: 330, epochAngleDeg: 214, orbitColor: "#8aa6b8", composition: [{ label: "Iron-nickel core", value: 54, color: "#9da4a7" }, { label: "Silicates", value: 34, color: "#a97d63" }, { label: "Water / ice", value: 12, color: "#70a9c7" }], atmosphere: "Thin carbon-dioxide atmosphere candidate", state: "Evolved post-main-sequence survivor · high bulk density", bioScore: 9, bioPrediction: "Residual heat may persist below ground, but stable liquid water is not expected." },
    ],
  },
  {
    system: { id: "SYS-NX-RG-044", designation: "NOCTUA-EMBER-CROWN-44", displayName: null, classification: "K2 III red giant", raHours: 17.2861, decDeg: -11.9042, distancePc: 118.5, starMass: 1.45, starRadius: 11.8, temperatureK: 4320, luminosity: 65, ageByr: 3.9, metallicity: 0.11, status: "published", confidence: 76, summary: "An expanded red-giant star with three planetary candidates tracing different stages of stellar evolution.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-RG-044-B", code: "NOCTUA-EMBER-CROWN-44 b", type: "Inflated hot gas giant", massEarth: 220, radiusEarth: 11.6, periodDays: 116, semiMajorAu: 0.68, eccentricity: 0.09, equilibriumTemp: 980, epochAngleDeg: 22, orbitColor: "#d99a64", composition: [{ label: "Hydrogen / helium", value: 86, color: "#d8c29c" }, { label: "Heavy elements", value: 9, color: "#9a826f" }, { label: "Other", value: 5, color: "#6f7880" }], atmosphere: "Expanded hydrogen-helium envelope", state: "Strong stellar heating · atmospheric escape candidate", bioScore: 1, bioPrediction: "The atmosphere is too hot and turbulent for known life." },
      { id: "PL-NX-RG-044-C", code: "NOCTUA-EMBER-CROWN-44 c", type: "Evaporating rocky core", massEarth: 8.8, radiusEarth: 2.1, periodDays: 520, semiMajorAu: 1.7, eccentricity: 0.16, equilibriumTemp: 510, epochAngleDeg: 154, orbitColor: "#bc654b", composition: [{ label: "Silicates", value: 51, color: "#bd7c58" }, { label: "Iron-nickel core", value: 39, color: "#a6a8a8" }, { label: "Other", value: 10, color: "#687984" }], atmosphere: "Escaping mineral-rich atmosphere candidate", state: "Former envelope stripped during red-giant expansion", bioScore: 1, bioPrediction: "Surface conditions are incompatible with known life." },
      { id: "PL-NX-RG-044-D", code: "NOCTUA-EMBER-CROWN-44 d", type: "Distant ice giant", massEarth: 23, radiusEarth: 4.1, periodDays: 3470, semiMajorAu: 6.4, eccentricity: 0.21, equilibriumTemp: 180, epochAngleDeg: 287, orbitColor: "#718fbe", composition: [{ label: "Water / ice", value: 52, color: "#7fa9c5" }, { label: "Hydrogen / helium", value: 34, color: "#d1c7b4" }, { label: "Rock", value: 14, color: "#8f715f" }], atmosphere: "Hydrogen, helium and methane candidate", state: "Wide orbit · illuminated by an evolved giant star", bioScore: 5, bioPrediction: "A deep atmosphere is inhospitable, while any large moons remain unconstrained." },
    ],
  },
  {
    system: { id: "SYS-NX-TRI-052", designation: "NOCTUA-TRINITY-52", displayName: null, classification: "Three-star figure-eight choreography", raHours: 2.6387, decDeg: 31.572, distancePc: 64.9, starMass: 2.1, starRadius: 1.08, temperatureK: 6120, luminosity: 2.5, ageByr: 2.8, metallicity: -0.02, status: "published", confidence: 69, summary: "A speculative hierarchical triple-star model displayed as a shared figure-eight stellar choreography.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-TRI-052-B", code: "NOCTUA-TRINITY-52 b", type: "Hot circummultiple mini-Neptune", massEarth: 12, radiusEarth: 3.05, periodDays: 58, semiMajorAu: 0.42, eccentricity: 0.07, equilibriumTemp: 630, epochAngleDeg: 91, orbitColor: "#c27b74", composition: [{ label: "Hydrogen / helium", value: 48, color: "#d4c6ae" }, { label: "Water / ice", value: 34, color: "#75a8c6" }, { label: "Rock", value: 18, color: "#9d745e" }], atmosphere: "Hydrogen, helium and water-vapour candidate", state: "Circummultiple orbit · variable three-star irradiation", bioScore: 4, bioPrediction: "The deep hot atmosphere is hostile to known life." },
      { id: "PL-NX-TRI-052-C", code: "NOCTUA-TRINITY-52 c", type: "Temperate circummultiple terrestrial", massEarth: 1.9, radiusEarth: 1.22, periodDays: 318, semiMajorAu: 1.15, eccentricity: 0.05, equilibriumTemp: 286, epochAngleDeg: 203, orbitColor: "#63b2a8", composition: [{ label: "Silicates", value: 49, color: "#b98766" }, { label: "Water / ice", value: 31, color: "#67abc8" }, { label: "Iron-nickel core", value: 20, color: "#a6a8a8" }], atmosphere: "Candidate nitrogen, water vapour and carbon dioxide", state: "Temperate circummultiple orbit · complex seasonal illumination", bioScore: 44, bioPrediction: "Liquid-water intervals may be possible, although three-star forcing could destabilise the climate." },
      { id: "PL-NX-TRI-052-D", code: "NOCTUA-TRINITY-52 d", type: "Outer ringed gas giant", massEarth: 95, radiusEarth: 8.2, periodDays: 1420, semiMajorAu: 3.8, eccentricity: 0.18, equilibriumTemp: 160, epochAngleDeg: 324, orbitColor: "#aa91c5", composition: [{ label: "Hydrogen / helium", value: 78, color: "#d3c6a4" }, { label: "Ices", value: 17, color: "#87a9c5" }, { label: "Heavy elements", value: 5, color: "#9a826f" }], atmosphere: "Hydrogen, helium and methane", state: "Wide circummultiple orbit · prominent ring system candidate", bioScore: 6, bioPrediction: "The giant is inhospitable; large moons could retain subsurface oceans." },
    ],
  },
  {
    system: { id: "SYS-NX-BG-061", designation: "NOCTUA-AZURE-CROWN-61", displayName: null, classification: "B0 Ia blue supergiant with ionised nebula", ...blueGiantModelPosition, starMass: 18.2, starRadius: 10.4, temperatureK: 26500, luminosity: 60000, ageByr: 0.009, metallicity: 0.02, status: "published", confidence: 67, summary: "A luminous blue-supergiant model embedded in a wind-shaped ionised nebula.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-BG-061-B", code: "NOCTUA-AZURE-CROWN-61 b", type: "Wind-eroded hot gas giant", massEarth: 280, radiusEarth: 12.1, periodDays: 6600, semiMajorAu: 18, eccentricity: 0.12, equilibriumTemp: 1020, epochAngleDeg: 38, orbitColor: "#7fa7d8", composition: [{ label: "Hydrogen / helium", value: 84, color: "#c8d6e8" }, { label: "Heavy elements", value: 11, color: "#8b8295" }, { label: "Other", value: 5, color: "#667685" }], atmosphere: "Ionised hydrogen-helium envelope under strong stellar wind", state: "Atmospheric escape · intense ultraviolet irradiation", bioScore: 0, bioPrediction: "Extreme radiation and atmospheric loss exclude known life." },
      { id: "PL-NX-BG-061-C", code: "NOCTUA-AZURE-CROWN-61 c", type: "Super-Jovian storm world", massEarth: 620, radiusEarth: 13.2, periodDays: 15400, semiMajorAu: 32, eccentricity: 0.18, equilibriumTemp: 760, epochAngleDeg: 164, orbitColor: "#7b83c5", composition: [{ label: "Hydrogen / helium", value: 88, color: "#c9c6dd" }, { label: "Heavy elements", value: 8, color: "#8a7893" }, { label: "Ices", value: 4, color: "#7fa9c5" }], atmosphere: "Hydrogen, helium and ionised metals", state: "Powerful storms · auroral magnetosphere", bioScore: 1, bioPrediction: "The deep irradiated atmosphere is hostile to known life." },
      { id: "PL-NX-BG-061-D", code: "NOCTUA-AZURE-CROWN-61 d", type: "Distant warm ice giant", massEarth: 31, radiusEarth: 4.6, periodDays: 57000, semiMajorAu: 75, eccentricity: 0.22, equilibriumTemp: 495, epochAngleDeg: 291, orbitColor: "#5eb7ca", composition: [{ label: "Water / ice", value: 49, color: "#73b5cd" }, { label: "Hydrogen / helium", value: 38, color: "#d1d7d7" }, { label: "Rock", value: 13, color: "#8b7467" }], atmosphere: "Ionised hydrogen, helium and water vapour", state: "Distant orbit · still heated by an exceptionally luminous star", bioScore: 2, bioPrediction: "Radiation and deep atmospheric pressure make habitability unlikely." },
    ],
  },
  {
    system: { id: "SYS-NX-PSR-067", designation: "NOCTUA-BEACON-67", displayName: null, classification: "Millisecond pulsar neutron-star system", ...pulsarModelPosition, starMass: 1.4, starRadius: 0.00002, temperatureK: 600000, luminosity: 0.002, ageByr: 0.4, metallicity: -0.3, status: "published", confidence: 71, summary: "A rapidly rotating neutron-star model with lighthouse beams and three compact-orbit candidates.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-PSR-067-B", code: "NOCTUA-BEACON-67 b", type: "Tidally heated iron planet", massEarth: 0.7, radiusEarth: 0.78, periodDays: 25.2, semiMajorAu: 0.19, eccentricity: 0.09, equilibriumTemp: 410, epochAngleDeg: 74, orbitColor: "#a99594", composition: [{ label: "Iron-nickel core", value: 59, color: "#a0a4a6" }, { label: "Silicates", value: 36, color: "#a87b62" }, { label: "Other", value: 5, color: "#65717a" }], atmosphere: "Negligible atmosphere", state: "Intense particle radiation · tidal heating", bioScore: 0, bioPrediction: "Pulsar radiation makes known surface life implausible." },
      { id: "PL-NX-PSR-067-C", code: "NOCTUA-BEACON-67 c", type: "Carbon-rich super-Earth", massEarth: 4.1, radiusEarth: 1.55, periodDays: 67.4, semiMajorAu: 0.46, eccentricity: 0.04, equilibriumTemp: 260, epochAngleDeg: 188, orbitColor: "#7d8da7", composition: [{ label: "Carbon-rich rock", value: 44, color: "#555b65" }, { label: "Silicates", value: 31, color: "#967763" }, { label: "Iron-nickel core", value: 25, color: "#a0a4a6" }], atmosphere: "Thin heavy-element atmosphere candidate", state: "Cold surface · high-energy particle bombardment", bioScore: 3, bioPrediction: "Subsurface shielding is conceivable, but no biosignature is predicted." },
      { id: "PL-NX-PSR-067-D", code: "NOCTUA-BEACON-67 d", type: "Frozen remnant world", massEarth: 2.6, radiusEarth: 1.38, periodDays: 340, semiMajorAu: 1.2, eccentricity: 0.13, equilibriumTemp: 145, epochAngleDeg: 309, orbitColor: "#7298b8", composition: [{ label: "Water / ice", value: 47, color: "#75aaca" }, { label: "Rock", value: 35, color: "#8d7666" }, { label: "Iron-nickel core", value: 18, color: "#a0a4a6" }], atmosphere: "Frozen nitrogen and carbon monoxide candidate", state: "Cryogenic surface · intermittent pulsar heating", bioScore: 2, bioPrediction: "Stable surface liquid water is not expected." },
    ],
  },
  {
    system: { id: "SYS-NX-BH-073", designation: "NOCTUA-UMBRA-73", displayName: null, classification: "Stellar-mass black hole + K-dwarf binary", ...blackHoleModelPosition, starMass: 9.8, starRadius: 0.78, temperatureK: 4650, luminosity: 0.32, ageByr: 5.6, metallicity: -0.08, status: "published", confidence: 63, summary: "A black-hole binary model with a luminous accretion disc, mass-transfer stream and two circumbinary candidates.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-BH-073-B", code: "NOCTUA-UMBRA-73 b", type: "Hot circumbinary gas giant", massEarth: 180, radiusEarth: 10.4, periodDays: 427, semiMajorAu: 2.4, eccentricity: 0.17, equilibriumTemp: 520, epochAngleDeg: 118, orbitColor: "#a6769e", composition: [{ label: "Hydrogen / helium", value: 80, color: "#c8bac4" }, { label: "Heavy elements", value: 14, color: "#856f82" }, { label: "Other", value: 6, color: "#65717a" }], atmosphere: "Hydrogen, helium and ionised trace metals", state: "Circumbinary orbit · variable X-ray irradiation", bioScore: 0, bioPrediction: "High-energy radiation excludes known atmospheric life." },
      { id: "PL-NX-BH-073-C", code: "NOCTUA-UMBRA-73 c", type: "Distant frozen super-Earth", massEarth: 6.4, radiusEarth: 1.9, periodDays: 2520, semiMajorAu: 7.8, eccentricity: 0.25, equilibriumTemp: 170, epochAngleDeg: 277, orbitColor: "#6d839f", composition: [{ label: "Water / ice", value: 45, color: "#729fbe" }, { label: "Silicates", value: 37, color: "#967763" }, { label: "Iron-nickel core", value: 18, color: "#a0a4a6" }], atmosphere: "Thin nitrogen and methane candidate", state: "Frozen surface · intermittent accretion-disc illumination", bioScore: 4, bioPrediction: "A buried ocean is speculative and would require internal heating." },
    ],
  },
  {
    system: { id: "SYS-NX-DP-081", designation: "NOCTUA-TWIN-WORLDS-81", displayName: null, classification: "Mutual-orbit double-planet system", ...doublePlanetModelPosition, starMass: 1.01, starRadius: 1.02, temperatureK: 5750, luminosity: 1.05, ageByr: 4.2, metallicity: 0.05, status: "published", confidence: 79, summary: "Two similarly sized planets orbit a shared barycentre while travelling together around a Sun-like star.", epochAt: "2026-07-20T00:00:00.000Z", publishedAt: "2026-07-20T00:00:00.000Z" },
    planets: [
      { id: "PL-NX-DP-081-B", code: "NOCTUA-TWIN-WORLDS-81 b", type: "Oceanic double planet", massEarth: 1.3, radiusEarth: 1.08, periodDays: 393, semiMajorAu: 1.05, eccentricity: 0.03, equilibriumTemp: 284, epochAngleDeg: 42, orbitColor: "#55aebf", composition: [{ label: "Water / ice", value: 42, color: "#63b4d0" }, { label: "Silicates", value: 40, color: "#a98266" }, { label: "Iron-nickel core", value: 18, color: "#a0a4a6" }], atmosphere: "Nitrogen, water vapour and carbon dioxide candidate", state: "Mutual barycentric orbit · global ocean candidate", bioScore: 58, bioPrediction: "Stable oceans and tidal energy may support microbial or marine ecosystems." },
      { id: "PL-NX-DP-081-C", code: "NOCTUA-TWIN-WORLDS-81 c", type: "Desert double planet", massEarth: 1.1, radiusEarth: 0.99, periodDays: 393, semiMajorAu: 1.05, eccentricity: 0.03, equilibriumTemp: 301, epochAngleDeg: 44, orbitColor: "#c48b5e", composition: [{ label: "Silicates", value: 63, color: "#c18a61" }, { label: "Iron-nickel core", value: 30, color: "#a0a4a6" }, { label: "Water / ice", value: 7, color: "#6f9fbb" }], atmosphere: "Thin nitrogen and carbon-dioxide candidate", state: "Mutual barycentric orbit · arid tidally influenced surface", bioScore: 24, bioPrediction: "Microbial life could persist in sheltered subsurface aquifers if water remains." },
      { id: "PL-NX-DP-081-D", code: "NOCTUA-TWIN-WORLDS-81 d", type: "Outer ringed gas giant", massEarth: 112, radiusEarth: 8.9, periodDays: 1850, semiMajorAu: 3.3, eccentricity: 0.14, equilibriumTemp: 155, epochAngleDeg: 286, orbitColor: "#9b8fc1", composition: [{ label: "Hydrogen / helium", value: 80, color: "#d3c6a4" }, { label: "Ices", value: 15, color: "#87a9c5" }, { label: "Heavy elements", value: 5, color: "#9a826f" }], atmosphere: "Hydrogen, helium and methane", state: "Outer orbit · prominent rings and moons possible", bioScore: 7, bioPrediction: "The giant is inhospitable; large moons may contain subsurface oceans." },
    ],
  },
  {
    system: { id: "SYS-LC-2026", designation: "NOCTUA-LILIUM-0721", displayName: null, classification: "F8V pearl-white main-sequence star", ...lilyModelPosition, starMass: 1.11, starRadius: 1.18, temperatureK: 6260, luminosity: 1.72, ageByr: 3.2, metallicity: 0.07, status: "published", confidence: 83, summary: "A four-planet candidate architecture prepared as the Lilium Aeternum private celestial dedication.", epochAt: "2026-07-21T00:00:00.000Z", publishedAt: "2026-07-21T00:00:00.000Z" },
    planets: [
      { id: "PL-LC-2026-B", code: "NOCTUA-LILIUM-0721 b", type: "Rose-lit mineral terrestrial", massEarth: 1.5, radiusEarth: 1.12, periodDays: 22.8, semiMajorAu: 0.163, eccentricity: 0.04, equilibriumTemp: 720, epochAngleDeg: 31, orbitColor: "#d87a78", composition: [{ label: "Silicates", value: 57, color: "#c98b72" }, { label: "Iron-nickel core", value: 36, color: "#a7aaad" }, { label: "Other", value: 7, color: "#7b6b78" }], atmosphere: "Thin sodium and mineral-vapour exosphere candidate", state: "Tidally influenced · rose-lit volcanic plains", bioScore: 1, bioPrediction: "Surface temperatures are too high for known life." },
      { id: "PL-LC-2026-C", code: "NOCTUA-LILIUM-0721 c", type: "Pearlescent ocean super-Earth", massEarth: 2.6, radiusEarth: 1.38, periodDays: 537.4, semiMajorAu: 1.34, eccentricity: 0.05, equilibriumTemp: 280, epochAngleDeg: 142, orbitColor: "#63b9cf", composition: [{ label: "Water / ice", value: 43, color: "#6ec2d8" }, { label: "Silicates", value: 39, color: "#b88e72" }, { label: "Iron-nickel core", value: 18, color: "#a7aaad" }], atmosphere: "Nitrogen, water vapour and trace carbon dioxide candidate", state: "Temperate ocean candidate · faint ring system", bioScore: 64, bioPrediction: "Persistent oceans, moderate irradiation and chemical gradients could support microbial or marine ecosystems; no biosignature has been observed." },
      { id: "PL-LC-2026-D", code: "NOCTUA-LILIUM-0721 d", type: "Lavender ringed gas giant", massEarth: 156, radiusEarth: 9.7, periodDays: 4335, semiMajorAu: 5.39, eccentricity: 0.12, equilibriumTemp: 139, epochAngleDeg: 238, orbitColor: "#9d8bc9", composition: [{ label: "Hydrogen / helium", value: 81, color: "#d6cce0" }, { label: "Water / ice", value: 13, color: "#86afc9" }, { label: "Heavy elements", value: 6, color: "#8e788a" }], atmosphere: "Hydrogen, helium and methane with high-altitude lavender haze", state: "Prominent rings · multiple moon candidates", bioScore: 8, bioPrediction: "The giant itself is inhospitable, while large icy moons could retain subsurface oceans." },
      { id: "PL-LC-2026-E", code: "NOCTUA-LILIUM-0721 e", type: "Distant crystalline ice world", massEarth: 5.8, radiusEarth: 1.82, periodDays: 16620, semiMajorAu: 13.2, eccentricity: 0.18, equilibriumTemp: 89, epochAngleDeg: 319, orbitColor: "#8ba9c6", composition: [{ label: "Water / ice", value: 58, color: "#91bdd3" }, { label: "Silicates", value: 29, color: "#9d8575" }, { label: "Iron-nickel core", value: 13, color: "#a7aaad" }], atmosphere: "Seasonal nitrogen and methane frost candidate", state: "Cryogenic surface · long orbital seasons", bioScore: 3, bioPrediction: "Known surface life is unlikely; internal radiogenic heating remains unconstrained." },
    ],
  },
];

const defaultPackages = [
  { id: "PKG-EXPLORER", name: "Explorer", priceTwd: 200 * USD_PRICING_RATE_TWD, description: "A private memorial registry for one candidate planet", featuresJson: JSON.stringify(["Digital naming certificate", "Live orbital animation", "Unique planetary designation"]), active: true, sortOrder: 1 },
  { id: "PKG-OBSERVER", name: "Observer", priceTwd: 300 * USD_PRICING_RATE_TWD, description: "A star and its complete candidate planetary system", featuresJson: JSON.stringify(["Unique stellar-system registry", "4K system animation", "Annual position update"]), active: true, sortOrder: 2 },
  { id: "PKG-ARCHIVIST", name: "Archivist", priceTwd: 500 * USD_PRICING_RATE_TWD, description: "A complete archival record with bespoke presentation", featuresJson: JSON.stringify(["Print-ready archival certificate", "Custom dedication and thank-you letter", "Research dossier and high-resolution celestial artwork"]), active: true, sortOrder: 3 },
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

const lilyOwnerOrder = {
  id: "ORD-LILY-2026",
  createdAt: "2026-07-21T08:00:00.000Z",
  candidateId: "SYS-LC-2026",
  systemId: "SYS-LC-2026",
  planetId: "PL-LC-2026-C",
  desiredName: "Lilium Aeternum",
  purchaserName: "Xie Yao Zhong",
  ownerName: "Lily Chen",
  recipientEmail: null,
  dedication: "Happy Birthday, Lily. May this light remind you that you are cherished beyond distance, time, and every horizon still waiting to be discovered.",
  email: "xie-yao-zhong@noctua.invalid",
  packageName: "Archivist",
  amountTwd: 500 * USD_PRICING_RATE_TWD,
  status: "confirmed",
  registryCode: "NOR-LILY2026",
  animationTheme: "rose",
  confirmedAt: "2026-07-21T08:05:00.000Z",
  paymentProvider: "complimentary-gift",
  paymentMessage: "Complimentary Archivist gift prepared by Xie Yao Zhong for Lily Chen.",
};

const initialResearchUpdates = [
  { id: "UPD-NX-001-01", systemId: "SYS-NX-001", title: "Atmospheric model refined", summary: "A revised thermal model narrows the likely water-vapour range for NOCTUA-X1 d while preserving its status as the system’s strongest temperate candidate.", observingNote: "Best inspected in the holder sky guide near meridian transit; the coordinates remain model-derived and are not a confirmed telescope target.", symbolicMeaning: "A symbol of patient hope: something distant becoming clearer through sustained attention.", publishedAt: "2026-07-19T10:00:00.000Z" },
  { id: "UPD-NX-014-01", systemId: "SYS-NX-014", title: "Orbital solution stabilised", summary: "Additional synthetic sampling reduced uncertainty in the three-planet orbital configuration around NOCTUA-K14.", observingNote: "Use the live guide to calculate the next local meridian window from the model right ascension and declination.", symbolicMeaning: "A symbol of constancy and quiet devotion around a long-lived star.", publishedAt: "2026-07-18T10:00:00.000Z" },
  { id: "UPD-LC-2026-01", systemId: "SYS-LC-2026", title: "Lilium Aeternum model archive established", summary: "The initial four-planet architecture has been normalised against an F8V stellar prior and a deterministic Fibonacci-sphere sky coordinate model.", observingNote: "The coordinates are model-derived and should be treated as a visualisation target, not a confirmed telescope object.", symbolicMeaning: "An enduring light dedicated to Lily Chen: curiosity, grace and hope held in the same orbit.", publishedAt: "2026-07-21T08:10:00.000Z" },
  { id: "UPD-LC-2026-02", systemId: "SYS-LC-2026", title: "Temperate ocean-world scenario refined", summary: "A first-pass equilibrium-temperature model identifies NOCTUA-LILIUM-0721 c as the strongest temperate scenario in the system, subject to unmeasured atmospheric and albedo assumptions.", observingNote: "Future revisions should prioritise synthetic transit depth, atmospheric retention and climate sensitivity studies.", symbolicMeaning: "The ocean world represents a future rich with possibility: calm on the surface, depth beneath, and light always returning.", publishedAt: "2026-07-21T08:20:00.000Z" },
];

const showcaseNames = [
  "Aurelia Vow", "Blue Meridian", "Thalassa Promise", "Ember Covenant", "Lumen of June",
  "Velvet Orbit", "Cinder Halo", "Solace IX", "Evernight Bloom", "Golden Perihelion",
  "Opaline Tide", "Quiet Zenith", "Aurora Testament", "Silver Aphelion", "Vesper Haven",
  "Oceanus Echo", "Ivory Transit", "Saffron Eclipse", "Polaris Dream", "Eirenic Light",
  "Celestine Bond", "Nocturne Harbor", "Amber Continuum", "Starlit Oath", "Seraphic Current",
  "Moonfall Promise", "Aether Bloom", "Halcyon Signal", "Orion's Keepsake", "Crimson Meridian",
  "Luminous Shelter", "Astral Concord", "Borealis Memory", "Tidal Lantern", "Solaris Whisper",
  "Pale Blue Vow", "Eternal Ascension", "Nova Reverie", "Cerulean Kin", "Umbra of Us",
  "Radiant Archive", "Kepler's Garden", "Infinite Return", "Midsummer Star", "Cassiopeia Promise",
  "The Lasting Light", "Voyager's Home", "Ardent Horizon", "Perennial Dawn", "Our Quiet Cosmos",
];

const showcaseSystemTargets = [
  { systemId: "SYS-NX-001", systemDesignation: "NOCTUA-X1", planetPrefix: "PL-NX-001", planetCount: 4 },
  { systemId: "SYS-NX-014", systemDesignation: "NOCTUA-K14", planetPrefix: "PL-NX-014", planetCount: 3 },
  { systemId: "SYS-NX-BIN-021", systemDesignation: "NOCTUA-GEMINI-21", planetPrefix: "PL-NX-BIN-021", planetCount: 3 },
  { systemId: "SYS-NX-WD-031", systemDesignation: "NOCTUA-CINDER-31", planetPrefix: "PL-NX-WD-031", planetCount: 2 },
  { systemId: "SYS-NX-RG-044", systemDesignation: "NOCTUA-EMBER-CROWN-44", planetPrefix: "PL-NX-RG-044", planetCount: 3 },
  { systemId: "SYS-NX-TRI-052", systemDesignation: "NOCTUA-TRINITY-52", planetPrefix: "PL-NX-TRI-052", planetCount: 3 },
  { systemId: "SYS-NX-BG-061", systemDesignation: "NOCTUA-AZURE-CROWN-61", planetPrefix: "PL-NX-BG-061", planetCount: 3 },
  { systemId: "SYS-NX-PSR-067", systemDesignation: "NOCTUA-BEACON-67", planetPrefix: "PL-NX-PSR-067", planetCount: 3 },
  { systemId: "SYS-NX-BH-073", systemDesignation: "NOCTUA-UMBRA-73", planetPrefix: "PL-NX-BH-073", planetCount: 2 },
  { systemId: "SYS-NX-DP-081", systemDesignation: "NOCTUA-TWIN-WORLDS-81", planetPrefix: "PL-NX-DP-081", planetCount: 3 },
];

const registryShowcase = showcaseNames.map((desiredName, index) => {
  const target = showcaseSystemTargets[index % showcaseSystemTargets.length];
  const planetIndex = index % target.planetCount;
  const planetLetter = String.fromCharCode(98 + planetIndex);
  return {
    sequence: index + 1,
    desiredName,
    registryCode: `NOR-SHOW-${String(index + 1).padStart(4, "0")}`,
    systemId: target.systemId,
    systemDesignation: target.systemDesignation,
    planetId: `${target.planetPrefix}-${planetLetter.toUpperCase()}`,
    planetCode: `${target.systemDesignation} ${planetLetter}`,
    previewedAt: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
    recordType: "Illustrative holder story",
    sharingStatus: "Preview only — not a verified customer record",
  };
});

export async function ensureUniverseSeeded() {
  const db = getDb();
  for (const item of initialSystems) {
    await db.insert(starSystems).values(item.system).onConflictDoNothing();
    await db.insert(planets).values(item.planets.map((planet) => {
      const { composition, ...planetData } = planet;
      return { ...planetData, systemId: item.system.id, displayName: null, compositionJson: JSON.stringify(composition) };
    })).onConflictDoNothing();
  }
  for (const item of defaultPackages) {
    await db.insert(namingPackages).values(item).onConflictDoUpdate({
      target: namingPackages.id,
      set: { name: item.name, priceTwd: item.priceTwd, description: item.description, featuresJson: item.featuresJson, active: item.active, sortOrder: item.sortOrder, updatedAt: new Date().toISOString() },
    });
  }
  await db.insert(namingOrders).values(demoOwnerOrder).onConflictDoNothing();
  await db.insert(namingOrders).values(lilyOwnerOrder).onConflictDoNothing();
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
  const lifeSpeculation = planet.bioScore >= 55 && temperate
    ? "Creative analogue: an ocean biosphere could favour streamlined, fish-person-like amphibious beings with pressure-adapted eyes, lateral-line sensing and communal reef habitats. This is imaginative morphology, not evidence of intelligent life."
    : planet.bioScore >= 25 && temperate
      ? "Creative analogue: low, amphibious filter-feeders or translucent shoreline colonies could exploit tides and chemical gradients. Complex or intelligent life remains entirely unverified."
      : hot && planet.bioScore > 0
        ? "Creative analogue: a heat-shielded, xenomorph-like armoured crawler might shelter underground and metabolise mineral chemistry. The model does not predict an actual creature or prove life."
        : giant || subNeptune
          ? "Creative analogue: buoyant balloon-like floaters, aerial filter-feeders or microbial cloud colonies could occupy a narrow atmospheric layer; there is no observational evidence for them."
          : "No complex morphology is favoured. If life existed, the least speculative form would be dormant subsurface microbes rather than animal-like organisms."
  return { ...planet, type, atmosphere, state, bioPrediction, lifeSpeculation, composition: planet.composition.map((item) => ({ ...item, label: compositionLabels[item.label] ?? (/^[\x00-\x7F]*$/.test(item.label) ? item.label : "Estimated material") })) };
}

function publicSystem(system: HydratedSystem) {
  const binary = system.id === "SYS-NX-BIN-021" || /binary/i.test(system.classification);
  const whiteDwarf = system.id === "SYS-NX-WD-031";
  const redGiant = system.id === "SYS-NX-RG-044";
  const triple = system.id === "SYS-NX-TRI-052";
  const blueGiant = system.id === "SYS-NX-BG-061";
  const pulsar = system.id === "SYS-NX-PSR-067";
  const blackHole = system.id === "SYS-NX-BH-073";
  const doublePlanet = system.id === "SYS-NX-DP-081";
  const lilySystem = system.id === "SYS-LC-2026";
  const classification = lilySystem ? "F8V pearl-white main-sequence star" : blackHole ? "Stellar-mass black hole + K-dwarf binary" : binary ? "G2V + K1V close binary star pair" : whiteDwarf ? "DA white dwarf stellar remnant" : redGiant ? "K2 III red giant" : triple ? "Three-star figure-eight choreography" : blueGiant ? "B0 Ia blue supergiant with ionised nebula" : pulsar ? "Millisecond pulsar neutron-star system" : doublePlanet ? "Mutual-orbit double-planet system" : system.temperatureK >= 6000 ? "F-type main-sequence star" : system.temperatureK >= 5200 ? "G-type main-sequence star" : "K-type orange dwarf";
  const summary = lilySystem ? "A four-planet candidate model centred on a temperate pearlescent ocean world and prepared as the Lilium Aeternum private celestial dedication." : blackHole ? `A ${system.planets.length}-planet circumbinary model around a stellar-mass black hole and donor star.` : binary ? `A ${system.planets.length}-planet circumbinary candidate system modelled around a close G-type and K-type stellar pair.` : whiteDwarf ? `A ${system.planets.length}-planet survivor system around a hot, compact white-dwarf remnant.` : redGiant ? `A ${system.planets.length}-planet evolved system shaped by the expansion of a red-giant star.` : triple ? `A ${system.planets.length}-planet circummultiple model around three stars displayed in a schematic figure-eight choreography.` : blueGiant ? `A ${system.planets.length}-planet model around a luminous blue supergiant inside a wind-shaped ionised nebula.` : pulsar ? `A ${system.planets.length}-planet compact system modelled around a rapidly rotating neutron star.` : doublePlanet ? `A ${system.planets.length}-planet model featuring two terrestrial worlds in a mutual barycentric orbit.` : `A ${system.planets.length}-planet candidate system inferred from converging periodic signals and awaiting independent observational confirmation.`;
  return { ...system, classification, summary, planets: system.planets.map(publicPlanet) };
}

const englishPackages: Record<string, { name: string; description: string; features: string[] }> = {
  "PKG-EXPLORER": { name: "Explorer", description: "A private memorial registry for one candidate planet", features: ["Digital naming certificate", "Live orbital animation", "Unique planetary designation"] },
  "PKG-OBSERVER": { name: "Observer", description: "A star and its complete candidate planetary system", features: ["Unique stellar-system registry", "4K system animation", "Annual position update"] },
  "PKG-ARCHIVIST": { name: "Archivist", description: "A complete archival record with bespoke presentation", features: ["Print-ready archival certificate", "Custom dedication and thank-you letter", "Research dossier and high-resolution celestial artwork"] },
};

function publicPackage<T extends { id: string; name: string; priceTwd: number; description: string; featuresJson: string }>(item: T) {
  const translated = englishPackages[item.id];
  const rawFeatures = parseJson<string[]>(item.featuresJson, []);
  return { ...item, priceUsd: usdFromTwd(item.priceTwd), name: translated?.name ?? (/^[\x00-\x7F]*$/.test(item.name) ? item.name : "Celestial Registry"), description: translated?.description ?? (/^[\x00-\x7F]*$/.test(item.description) ? item.description : "A personalised private celestial registry edition"), features: translated?.features ?? rawFeatures.map((feature) => /^[\x00-\x7F]*$/.test(feature) ? feature : "Personalised archival deliverable") };
}

export async function getPublicUniverse() {
  await ensureUniverseSeeded();
  const db = getDb();
  const systems = await db.select().from(starSystems).where(eq(starSystems.status, "published")).orderBy(desc(starSystems.publishedAt));
  const packages = await db.select().from(namingPackages).where(eq(namingPackages.active, true)).orderBy(asc(namingPackages.sortOrder));
  return { systems: (await hydrateSystems(systems)).map(publicSystem), packages: packages.map(publicPackage), registryShowcase };
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
  return { systems: await hydrateSystems(systems), packages: packages.map((item) => ({ ...item, priceUsd: usdFromTwd(item.priceTwd), features: parseJson<string[]>(item.featuresJson, []) })), orders: orders.map((item) => ({ ...item, amountUsd: usdFromTwd(item.amountTwd) })), runs, updates, settings: Object.fromEntries(settings.map((item) => [item.key, item.value])), payment: getPaymentPublicInfo() };
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

export async function savePackage(payload: { id?: string; name: string; priceUsd: number; description: string; features: string[]; active: boolean }) {
  const db = getDb();
  const id = payload.id || `PKG-${Date.now().toString(36).toUpperCase()}`;
  const priceTwd = Math.round(Math.max(0, payload.priceUsd) * USD_PRICING_RATE_TWD);
  await db.insert(namingPackages).values({ id, name: payload.name, priceTwd, description: payload.description, featuresJson: JSON.stringify(payload.features), active: payload.active, sortOrder: Date.now() % 100000 }).onConflictDoUpdate({ target: namingPackages.id, set: { name: payload.name, priceTwd, description: payload.description, featuresJson: JSON.stringify(payload.features), active: payload.active, updatedAt: new Date().toISOString() } });
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
