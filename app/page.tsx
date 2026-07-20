"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Composition = { label: string; value: number; color: string };
type Planet = {
  id: string; code: string; displayName: string | null; type: string; massEarth: number; radiusEarth: number;
  periodDays: number; semiMajorAu: number; eccentricity: number; equilibriumTemp: number; epochAngleDeg: number;
  orbitColor: string; composition: Composition[]; atmosphere: string; state: string; bioScore: number; bioPrediction: string;
};
type StarSystem = {
  id: string; designation: string; displayName: string | null; classification: string; raHours: number; decDeg: number;
  distancePc: number; starMass: number; starRadius: number; temperatureK: number; luminosity: number; ageByr: number;
  metallicity: number; confidence: number; summary: string; epochAt: string; publishedAt: string; planets: Planet[];
};
type NamingPackage = { id: string; name: string; priceTwd: number; description: string; features: string[] };
type Registry = { order: { registryCode: string; desiredName: string; ownerName: string; dedication: string; packageName: string }; system: StarSystem };
type SolarBody = {
  id: string; name: string; english: string; type: string; au: number; periodDays: number; radiusEarth: number;
  color: string; accent: string; epochAngle: number; eccentricity: number; perihelionLongitude: number;
  temperature: string; moons: number; summary: string;
};
type SolarMoon = {
  id: string; parentId: string; name: string; english: string; type: string; radiusEarth: number;
  orbitalPeriodDays: number; orbitDistanceKm: number; epochAngle: number; color: string; accent: string;
  composition: string; state: string; bioScore: number; bioPrediction: string;
};

const solarBodies: SolarBody[] = [
  { id: "mercury", name: "水星", english: "MERCURY", type: "岩質行星", au: .387, periodDays: 87.969, radiusEarth: .383, color: "#8f8b84", accent: "#d6d0c5", epochAngle: 252.2503235, eccentricity: .20563593, perihelionLongitude: 77.45779628, temperature: "−180～430°C", moons: 0, summary: "最接近太陽的行星，表面布滿撞擊坑，晝夜溫差極大。" },
  { id: "venus", name: "金星", english: "VENUS", type: "岩質行星", au: .723, periodDays: 224.701, radiusEarth: .949, color: "#c98643", accent: "#ffe0a1", epochAngle: 181.9790995, eccentricity: .00677672, perihelionLongitude: 131.60246718, temperature: "約 465°C", moons: 0, summary: "被濃厚二氧化碳大氣包覆，是太陽系中表面最炙熱的行星。" },
  { id: "earth", name: "地球", english: "EARTH", type: "海洋岩質行星", au: 1, periodDays: 365.256, radiusEarth: 1, color: "#2876a9", accent: "#80d5e8", epochAngle: 100.46457166, eccentricity: .01671123, perihelionLongitude: 102.93768193, temperature: "平均 15°C", moons: 1, summary: "目前唯一確認擁有生命的世界，液態海洋覆蓋大部分表面。" },
  { id: "mars", name: "火星", english: "MARS", type: "岩質行星", au: 1.524, periodDays: 686.98, radiusEarth: .532, color: "#a94d2f", accent: "#ef946c", epochAngle: -4.55343205, eccentricity: .0933941, perihelionLongitude: -23.94362959, temperature: "平均 −63°C", moons: 2, summary: "寒冷乾燥的紅色行星，保留古代河道與可能曾有液態水的證據。" },
  { id: "jupiter", name: "木星", english: "JUPITER", type: "氣態巨行星", au: 5.203, periodDays: 4332.589, radiusEarth: 11.21, color: "#b98b68", accent: "#f0d1a8", epochAngle: 34.39644051, eccentricity: .04838624, perihelionLongitude: 14.72847983, temperature: "雲頂約 −110°C", moons: 101, summary: "太陽系最大的行星，強大磁場與大紅斑風暴共同塑造它的外觀。" },
  { id: "saturn", name: "土星", english: "SATURN", type: "環系氣態巨行星", au: 9.537, periodDays: 10759.22, radiusEarth: 9.45, color: "#c7a56c", accent: "#ffe2a5", epochAngle: 49.95424423, eccentricity: .05386179, perihelionLongitude: 92.59887831, temperature: "雲頂約 −140°C", moons: 274, summary: "擁有太陽系最醒目的冰粒環系，密度甚至低於液態水。" },
  { id: "uranus", name: "天王星", english: "URANUS", type: "冰巨行星", au: 19.19, periodDays: 30685.4, radiusEarth: 4.01, color: "#70b9bf", accent: "#c0f5ed", epochAngle: 313.23810451, eccentricity: .04725744, perihelionLongitude: 170.9542763, temperature: "雲頂約 −195°C", moons: 28, summary: "自轉軸幾乎側躺在軌道面上，淡青色來自大氣中的甲烷。" },
  { id: "neptune", name: "海王星", english: "NEPTUNE", type: "冰巨行星", au: 30.07, periodDays: 60189, radiusEarth: 3.88, color: "#3559a8", accent: "#769cff", epochAngle: -55.12002969, eccentricity: .00859048, perihelionLongitude: 44.96476227, temperature: "雲頂約 −200°C", moons: 16, summary: "最外側的主要行星，深藍大氣中吹著太陽系最快的風。" },
];

const solarMoons: SolarMoon[] = [
  { id: "moon", parentId: "earth", name: "月球", english: "MOON", type: "岩質衛星", radiusEarth: .273, orbitalPeriodDays: 27.322, orbitDistanceKm: 384400, epochAngle: 218, color: "#aaa9a2", accent: "#eee9dc", composition: "矽酸鹽地殼 · 岩石地函 · 鐵質核心", state: "潮汐鎖定 · 撞擊坑與古老熔岩平原", bioScore: 2, bioPrediction: "未發現原生生命；極區水冰可支援未來載人活動。" },
  { id: "phobos", parentId: "mars", name: "火衛一", english: "PHOBOS", type: "不規則岩質衛星", radiusEarth: .00176, orbitalPeriodDays: .319, orbitDistanceKm: 9376, epochAngle: 61, color: "#77695b", accent: "#b7a28b", composition: "多孔岩石 · 碳質表土候選", state: "極低軌道 · 緩慢向火星下降", bioScore: 0, bioPrediction: "缺乏大氣與穩定液態水，原生生命可能性極低。" },
  { id: "io", parentId: "jupiter", name: "木衛一", english: "IO", type: "火山岩質衛星", radiusEarth: .286, orbitalPeriodDays: 1.769, orbitDistanceKm: 421700, epochAngle: 18, color: "#d9b04e", accent: "#fff0a0", composition: "矽酸鹽岩石 · 硫與二氧化硫", state: "太陽系火山活動最旺盛的天體", bioScore: 1, bioPrediction: "強烈輻射與持續火山作用，使已知生命難以生存。" },
  { id: "europa", parentId: "jupiter", name: "木衛二", english: "EUROPA", type: "冰殼海洋衛星", radiusEarth: .245, orbitalPeriodDays: 3.551, orbitDistanceKm: 671100, epochAngle: 126, color: "#c8b48b", accent: "#eaf7ff", composition: "水冰外殼 · 鹽水海洋候選 · 岩石核心", state: "潮汐加熱 · 冰殼裂隙 · 地下海洋強證據", bioScore: 78, bioPrediction: "地下海洋可能同時具備液態水、化學能與岩水交互作用，是高優先生命候選環境。" },
  { id: "ganymede", parentId: "jupiter", name: "木衛三", english: "GANYMEDE", type: "大型冰岩衛星", radiusEarth: .413, orbitalPeriodDays: 7.155, orbitDistanceKm: 1070400, epochAngle: 224, color: "#8e8172", accent: "#c8d7dc", composition: "水冰 · 矽酸鹽岩石 · 金屬核心", state: "太陽系最大衛星 · 具有自身磁場與地下海洋", bioScore: 58, bioPrediction: "深層海洋可能存在可居住條件，但冰層厚度與能量來源仍待確認。" },
  { id: "callisto", parentId: "jupiter", name: "木衛四", english: "CALLISTO", type: "古老冰岩衛星", radiusEarth: .378, orbitalPeriodDays: 16.689, orbitDistanceKm: 1882700, epochAngle: 314, color: "#615c55", accent: "#b9b4aa", composition: "水冰 · 岩石 · 鹽水海洋候選", state: "密集撞擊坑 · 地質活動較低", bioScore: 43, bioPrediction: "可能存在深層鹽水海洋，但可用能量與表面物質交換較有限。" },
  { id: "enceladus", parentId: "saturn", name: "土衛二", english: "ENCELADUS", type: "噴流海洋衛星", radiusEarth: .0395, orbitalPeriodDays: 1.37, orbitDistanceKm: 238000, epochAngle: 81, color: "#dbe8e8", accent: "#ffffff", composition: "水冰 · 鹽類 · 有機物 · 岩石核心", state: "全球地下海洋 · 南極冰粒與水氣噴流", bioScore: 82, bioPrediction: "噴流顯示海水、熱能與有機物條件，是太陽系最重要的生命探測目標之一。" },
  { id: "titan", parentId: "saturn", name: "土衛六", english: "TITAN", type: "濃厚大氣冰衛星", radiusEarth: .404, orbitalPeriodDays: 15.945, orbitDistanceKm: 1221870, epochAngle: 249, color: "#b77f34", accent: "#ffd58a", composition: "氮氣大氣 · 甲烷與乙烷 · 水冰地殼", state: "甲烷雲雨循環 · 地表湖海 · 地下水海洋候選", bioScore: 52, bioPrediction: "表面化學與地下海洋皆具研究價值，但低溫環境中的生命形式仍屬高度推測。" },
  { id: "triton", parentId: "neptune", name: "海衛一", english: "TRITON", type: "逆行冰質衛星", radiusEarth: .212, orbitalPeriodDays: -5.877, orbitDistanceKm: 354800, epochAngle: 173, color: "#b7aca4", accent: "#d6f1f4", composition: "氮冰 · 甲烷冰 · 水冰與岩石", state: "逆行軌道 · 可能為被捕獲的古柏帶天體", bioScore: 24, bioPrediction: "可能保有深層海洋，但低溫、能量來源與物質交換仍不明確。" },
];

const halleyComet = {
  id: "halley", name: "哈雷彗星", english: "1P / HALLEY", type: "週期彗星", periodDays: 76.1 * 365.25,
  perihelionAu: .5871, aphelionAu: 35.25, eccentricity: .967, nucleus: "約 15 × 8 公里",
  nextReturn: "2061 年", color: "#d9f7f3", accent: "#88dff2",
  summary: "沿逆行高偏心軌道穿越太陽系；接近太陽時，冰質物昇華並形成背向太陽的塵埃尾與離子尾。",
};

const fallbackSystems: StarSystem[] = [{
  id: "SYS-NX-001", designation: "NOCTUA-X1", displayName: null, classification: "G8V 黃矮星", raHours: 19.8464, decDeg: 8.8683,
  distancePc: 47.2, starMass: 0.91, starRadius: 0.94, temperatureK: 5480, luminosity: 0.72, ageByr: 5.1, metallicity: 0.08,
  confidence: 86, summary: "徑向速度與凌日訊號交叉吻合的四行星候選系統。", epochAt: "2026-07-19T00:00:00.000Z", publishedAt: "2026-07-19T00:00:00.000Z",
  planets: [
    { id: "PL-NX-001-B", code: "NOCTUA-X1 b", displayName: null, type: "熔岩岩質行星", massEarth: 1.7, radiusEarth: 1.19, periodDays: 8.42, semiMajorAu: .078, eccentricity: .03, equilibriumTemp: 982, epochAngleDeg: 34, orbitColor: "#d46b3c", composition: [{ label: "矽酸鹽", value: 61, color: "#d97848" }, { label: "鐵鎳核心", value: 34, color: "#a8a9a7" }, { label: "其他", value: 5, color: "#617682" }], atmosphere: "極稀薄鈉、氧外逸層", state: "潮汐鎖定 · 強烈火山活動", bioScore: 1, bioPrediction: "表面溫度過高，已知型態生命可能性極低。" },
    { id: "PL-NX-001-C", code: "NOCTUA-X1 c", displayName: null, type: "溫暖超級地球", massEarth: 4.8, radiusEarth: 1.73, periodDays: 46.2, semiMajorAu: .244, eccentricity: .07, equilibriumTemp: 421, epochAngleDeg: 158, orbitColor: "#dfaa62", composition: [{ label: "岩石地函", value: 58, color: "#c58b5d" }, { label: "金屬核心", value: 26, color: "#a8a9a7" }, { label: "水／冰", value: 16, color: "#6d9ec7" }], atmosphere: "氮、二氧化碳、水氣候選", state: "高壓溫室 · 可能有季節循環", bioScore: 22, bioPrediction: "高層雲帶可能存在溫和區，但尚無直接生物標記。" },
    { id: "PL-NX-001-D", code: "NOCTUA-X1 d", displayName: null, type: "宜居帶海洋候選體", massEarth: 2.3, radiusEarth: 1.34, periodDays: 126.4, semiMajorAu: .478, eccentricity: .12, equilibriumTemp: 286, epochAngleDeg: 242, orbitColor: "#72b6c9", composition: [{ label: "矽酸鹽", value: 43, color: "#bd8b63" }, { label: "水／冰", value: 39, color: "#6ab6d5" }, { label: "鐵鎳", value: 18, color: "#a8a9a7" }], atmosphere: "氮、水氣、微量甲烷候選", state: "液態水條件可能 · 模型穩定", bioScore: 61, bioPrediction: "具有液態水與能量梯度條件；生物可能性為中等，需光譜確認。" },
    { id: "PL-NX-001-E", code: "NOCTUA-X1 e", displayName: null, type: "冰冷氣態巨行星", massEarth: 128, radiusEarth: 9.2, periodDays: 682, semiMajorAu: 1.47, eccentricity: .19, equilibriumTemp: 163, epochAngleDeg: 306, orbitColor: "#9c8fc4", composition: [{ label: "氫氦", value: 79, color: "#d3c6a4" }, { label: "冰質物", value: 16, color: "#87a9c5" }, { label: "重元素", value: 5, color: "#9a826f" }], atmosphere: "氫、氦、甲烷", state: "外層雲帶穩定 · 可能有大型衛星", bioScore: 8, bioPrediction: "行星本體不適居；衛星可能具有地下海洋環境。" },
  ],
}];

const fallbackPackages: NamingPackage[] = [
  { id: "PKG-EXPLORER", name: "探索者", priceTwd: 680, description: "一顆行星的私人紀念登錄", features: ["數位命名證書", "即時軌道動畫", "專屬行星編號"] },
  { id: "PKG-OBSERVER", name: "觀測者", priceTwd: 1280, description: "恆星與完整行星體系登錄", features: ["恆星體系專屬編號", "4K 星系動畫", "年度位置更新"] },
  { id: "PKG-ARCHIVIST", name: "典藏者", priceTwd: 2680, description: "完整典藏檔案與客製動畫", features: ["可列印典藏證書", "客製獻詞", "完整軌道與成分報告"] },
];

function formatRa(hours: number) {
  const h = Math.floor(hours); const min = Math.floor((hours - h) * 60); const sec = (((hours - h) * 60 - min) * 60).toFixed(1);
  return `${String(h).padStart(2, "0")}h ${String(min).padStart(2, "0")}m ${sec}s`;
}

function formatDec(value: number) { return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(4)}°`; }

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
}

function paintStarField(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, count = 150) {
  for (let index = 0; index < count; index += 1) {
    const x = seeded(index, 2) * w;
    const y = seeded(index, 7) * h;
    const size = .35 + seeded(index, 11) * 1.35;
    const twinkle = .28 + .52 * (.5 + .5 * Math.sin(time * .0012 + seeded(index, 13) * 12));
    ctx.fillStyle = `rgba(${index % 9 === 0 ? "181,211,255" : "225,238,244"},${twinkle})`;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    if (size > 1.35) {
      ctx.strokeStyle = `rgba(205,226,255,${twinkle * .3})`; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x + 3.5, y); ctx.moveTo(x, y - 3.5); ctx.lineTo(x, y + 3.5); ctx.stroke();
    }
  }
}

function SolarSystemCanvas({ selectedId, onSelect, mode, speed, paused }: { selectedId: string; onSelect: (id: string) => void; mode: "live" | "animation"; speed: number; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<{ id: string; x: number; y: number; radius: number }[]>([]);
  const simulationDaysRef = useRef(0);
  const previousTimeRef = useRef<number | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (mode === "live") simulationDaysRef.current = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const previous = previousTimeRef.current ?? time;
      const deltaSeconds = Math.min((time - previous) / 1000, .1);
      previousTimeRef.current = time;
      if (mode === "animation" && !paused && !reduceMotion) simulationDaysRef.current += deltaSeconds * speed * 6;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width; const h = rect.height; const cx = w * .5; const cy = h * .51;
      const space = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .78);
      space.addColorStop(0, "#0c2032"); space.addColorStop(.42, "#061322"); space.addColorStop(1, "#01050b");
      ctx.fillStyle = space; ctx.fillRect(0, 0, w, h);

      const nebula = ctx.createRadialGradient(w * .16, h * .18, 0, w * .16, h * .18, w * .55);
      nebula.addColorStop(0, "rgba(40,94,139,.17)"); nebula.addColorStop(.5, "rgba(33,49,92,.06)"); nebula.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula; ctx.fillRect(0, 0, w, h);
      paintStarField(ctx, w, h, reduceMotion ? 0 : time, Math.max(120, Math.floor(w * h / 3300)));

      const tilt = -.11; const flatten = .47; const maxOrbit = Math.min(w * .455, h * .455);
      const orbitRadius = (au: number) => 34 + Math.pow(au / 30.07, .24) * (maxOrbit - 34);
      const transformPoint = (angle: number, radius: number) => {
        const ox = Math.cos(angle) * radius; const oy = Math.sin(angle) * radius * flatten;
        return { x: cx + ox * Math.cos(tilt) - oy * Math.sin(tilt), y: cy + ox * Math.sin(tilt) + oy * Math.cos(tilt) };
      };
      const halleySemi = maxOrbit * .96;
      const halleyPeri = Math.max(27, maxOrbit * .105);
      const halleyFocus = halleySemi - halleyPeri;
      const halleyMinor = Math.sqrt(halleySemi ** 2 - halleyFocus ** 2) * .62;
      const halleyRotation = .72;
      const halleyPoint = (eccentricAnomaly: number) => {
        const localX = -halleyFocus + Math.cos(eccentricAnomaly) * halleySemi;
        const localY = Math.sin(eccentricAnomaly) * halleyMinor;
        return { x: cx + localX * Math.cos(halleyRotation) - localY * Math.sin(halleyRotation), y: cy + localX * Math.sin(halleyRotation) + localY * Math.cos(halleyRotation) };
      };
      const daysSinceHalleyPerihelion = (Date.now() - new Date("1986-02-09T00:00:00.000Z").getTime()) / 86400000 + simulationDaysRef.current;
      const halleyMeanAnomaly = ((daysSinceHalleyPerihelion / halleyComet.periodDays) * Math.PI * 2) % (Math.PI * 2);
      let halleyEccentricAnomaly = halleyMeanAnomaly;
      for (let iteration = 0; iteration < 8; iteration += 1) halleyEccentricAnomaly -= (halleyEccentricAnomaly - halleyComet.eccentricity * Math.sin(halleyEccentricAnomaly) - halleyMeanAnomaly) / (1 - halleyComet.eccentricity * Math.cos(halleyEccentricAnomaly));
      const halleyPosition = halleyPoint(-halleyEccentricAnomaly);

      const beltInner = orbitRadius(2.1); const beltOuter = orbitRadius(3.35);
      for (let index = 0; index < 330; index += 1) {
        const beltRadius = beltInner + seeded(index, 22) * (beltOuter - beltInner);
        const angle = seeded(index, 19) * Math.PI * 2 + simulationDaysRef.current * .00035;
        const dot = transformPoint(angle, beltRadius);
        ctx.fillStyle = `rgba(184,177,161,${.09 + seeded(index, 4) * .23})`;
        ctx.fillRect(dot.x, dot.y, .45 + seeded(index, 9), .45 + seeded(index, 9));
      }

      solarBodies.forEach((body) => {
        const orbit = orbitRadius(body.au);
        ctx.strokeStyle = body.id === selectedId ? `${body.accent}8c` : "rgba(146,178,199,.16)";
        ctx.lineWidth = body.id === selectedId ? 1.45 : .7;
        ctx.beginPath(); ctx.ellipse(cx, cy, orbit, orbit * flatten, tilt, 0, Math.PI * 2); ctx.stroke();
      });
      const sunPulse = 1 + Math.sin((reduceMotion ? 0 : time) / 700) * .035;
      const corona = ctx.createRadialGradient(cx, cy, 3, cx, cy, 54 * sunPulse);
      corona.addColorStop(0, "rgba(255,248,201,1)"); corona.addColorStop(.2, "rgba(255,194,78,.9)"); corona.addColorStop(.48, "rgba(255,122,34,.25)"); corona.addColorStop(1, "rgba(255,104,20,0)");
      ctx.fillStyle = corona; ctx.beginPath(); ctx.arc(cx, cy, 54 * sunPulse, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(time * .00003);
      for (let ray = 0; ray < 18; ray += 1) {
        ctx.rotate(Math.PI / 9); ctx.strokeStyle…5006 tokens truncated…h.PI * 2); ctx.fill(); }
        if (planet.id === selectedId) { ctx.strokeStyle = "rgba(255,255,255,.76)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, radius + 7 + Math.sin((reduceMotion ? 0 : time) / 250) * 2, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = planet.id === selectedId ? "#eef6f7" : "rgba(181,204,216,.58)"; ctx.font = `${planet.id === selectedId ? "600" : "400"} 10px ui-monospace, monospace`; ctx.fillText(ownerLabel && index === 0 ? ownerLabel : planet.code.split(" ").at(-1) ?? "", x + radius + 6, y - radius - 3);
      });
      ctx.fillStyle = "rgba(148,179,194,.46)"; ctx.font = "9px ui-monospace, monospace"; ctx.fillText(`REAL-TIME EPHEMERIS · ${new Date().toISOString().slice(0, 19)} UTC`, 18, h - 18);
      frame = requestAnimationFrame(draw);
    };
    observer = new ResizeObserver(() => undefined); observer.observe(canvas); frame = requestAnimationFrame(draw);
    const click = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      const hit = positionsRef.current.find((position) => Math.hypot(position.x - x, position.y - y) <= position.radius);
      if (hit) selectRef.current(hit.id);
    };
    const move = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      canvas.style.cursor = positionsRef.current.some((position) => Math.hypot(position.x - x, position.y - y) <= position.radius) ? "pointer" : "crosshair";
    };
    canvas.addEventListener("click", click); canvas.addEventListener("mousemove", move);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); canvas.removeEventListener("click", click); canvas.removeEventListener("mousemove", move); };
  }, [system, selectedId, mode, ownerLabel, speed, paused]);

  return <canvas ref={canvasRef} className="orbit-canvas" aria-label={`${system.designation} 即時行星軌道圖；點擊行星可查看詳情`} />;
}

export default function Home() {
  const [systems, setSystems] = useState<StarSystem[]>(fallbackSystems);
  const [packages, setPackages] = useState<NamingPackage[]>(fallbackPackages);
  const [solarPlanetId, setSolarPlanetId] = useState("earth");
  const [solarMode, setSolarMode] = useState<"live" | "animation">("live");
  const [solarSpeed, setSolarSpeed] = useState(1);
  const [solarPaused, setSolarPaused] = useState(false);
  const [systemId, setSystemId] = useState(fallbackSystems[0].id);
  const [planetId, setPlanetId] = useState(fallbackSystems[0].planets[2].id);
  const [mode, setMode] = useState<"live" | "animation">("live");
  const [systemSpeed, setSystemSpeed] = useState(1);
  const [systemPaused, setSystemPaused] = useState(false);
  const [orderPlan, setOrderPlan] = useState<NamingPackage | null>(null);
  const [orderDone, setOrderDone] = useState<string | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryCode, setRegistryCode] = useState("");
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [registryError, setRegistryError] = useState("");

  useEffect(() => {
    fetch("/api/public/systems").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      if (data.systems?.length) { setSystems(data.systems); setSystemId(data.systems[0].id); setPlanetId(data.systems[0].planets[0]?.id ?? ""); }
      if (data.packages?.length) setPackages(data.packages);
    }).catch(() => undefined);
  }, []);

  const system = useMemo(() => systems.find((item) => item.id === systemId) ?? systems[0], [systems, systemId]);
  const planet = useMemo(() => system.planets.find((item) => item.id === planetId) ?? system.planets[0], [system, planetId]);
  const selectedMoon = useMemo(() => solarMoons.find((item) => item.id === solarPlanetId), [solarPlanetId]);
  const solarPlanet = useMemo(() => solarBodies.find((item) => item.id === solarPlanetId) ?? solarBodies.find((item) => item.id === selectedMoon?.parentId) ?? solarBodies[2], [solarPlanetId, selectedMoon]);
  const isHalleySelected = solarPlanetId === halleyComet.id;
  const isMoonSelected = Boolean(selectedMoon);

  function chooseSystem(next: StarSystem) { setSystemId(next.id); setPlanetId(next.planets[0]?.id ?? ""); document.getElementById("observatory")?.scrollIntoView({ behavior: "smooth" }); }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!orderPlan) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ packageId: orderPlan.id, systemId: system.id, planetId: planet.id, desiredName: form.get("desiredName"), ownerName: form.get("ownerName"), email: form.get("email"), dedication: form.get("dedication") }) });
    const data = await response.json();
    if (!response.ok) return window.alert(data.error ?? "申請失敗");
    setOrderDone(data.order.id);
  }

  async function lookupRegistry(event: FormEvent) {
    event.preventDefault(); setRegistryError("");
    const response = await fetch(`/api/public/registry?code=${encodeURIComponent(registryCode)}`); const data = await response.json();
    if (!response.ok) return setRegistryError(data.error ?? "查詢失敗");
    setRegistry(data.registry);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-sigil">N</span><span><b>NOCTUA</b><small>暗夜天體觀測台</small></span></a>
        <nav><a href="#solar-system">太陽系</a><a href="#observatory">候選星系</a><a href="#discoveries">最新發布</a><a href="#registry">紀念命名</a><button onClick={() => setRegistryOpen(true)}>持有者入口</button></nav>
        <a className="admin-link" href="/admin">後台管理 ↗</a>
      </header>
      <div className="science-banner"><b>MODEL CANDIDATE</b> 所有天體皆為訊號推演候選體，尚非正式天文發現；位置依軌道週期與參考曆元即時計算。</div>

      <section className="solar-showcase" id="solar-system">
        <div className="solar-intro" id="top">
          <div><p className="eyebrow">HOME SYSTEM / LIVE SIMULATION</p><h1>從我們的太陽出發，<br /><em>看見行星、衛星與彗星正在移動。</em></h1></div>
          <div className="solar-intro-copy"><p>依 J2000 參考曆元、公轉週期與目前 UTC 時間推算的互動式太陽系。點擊行星、知名衛星或哈雷彗星，即時查看位置與環境概況。</p><div><span><i />即時星曆位置</span><span>8 PLANETS · 9 FEATURED MOONS</span><span>1P / HALLEY</span></div></div>
        </div>
        <div className="solar-console">
          <article className="solar-stage">
            <div className="solar-toolbar">
              <div><span className="live-pulse" /> SOLAR ORBITAL VIEW <small>軌道距離採視覺壓縮</small></div>
              <div className="solar-controls">
                <button className={solarMode === "live" ? "active" : ""} aria-pressed={solarMode === "live"} onClick={() => { setSolarMode("live"); setSolarPaused(false); }}>即時位置</button>
                <button className={solarMode === "animation" ? "active" : ""} aria-pressed={solarMode === "animation"} onClick={() => setSolarMode("animation")}>動畫預覽</button>
                {solarMode === "animation" && <>{[1, 6, 24].map((value) => <button key={value} className={solarSpeed === value ? "active" : ""} aria-pressed={solarSpeed === value} onClick={() => setSolarSpeed(value)}>{value}×</button>)}<button className={solarPaused ? "active pause" : "pause"} aria-pressed={solarPaused} onClick={() => setSolarPaused((value) => !value)}>{solarPaused ? "繼續" : "暫停"}</button></>}
              </div>
            </div>
            <SolarSystemCanvas selectedId={solarPlanetId} onSelect={setSolarPlanetId} mode={solarMode} speed={solarSpeed} paused={solarPaused} />
            <div className="solar-foot"><span>J2000 即時近似位置 · 衛星軌道採放大顯示</span><span>點擊星體選取</span></div>
          </article>
          <aside className="solar-inspector">
            <div className="solar-planet-title"><span className={isHalleySelected ? "comet-orb" : isMoonSelected ? "moon-orb" : ""} style={{ "--planet-color": isHalleySelected ? halleyComet.color : selectedMoon?.color ?? solarPlanet.color, "--planet-accent": isHalleySelected ? halleyComet.accent : selectedMoon?.accent ?? solarPlanet.accent } as React.CSSProperties} /><div><small>{isHalleySelected ? halleyComet.english : selectedMoon?.english ?? solarPlanet.english} / SELECTED</small><h2>{isHalleySelected ? halleyComet.name : selectedMoon?.name ?? solarPlanet.name}</h2><p>{isHalleySelected ? halleyComet.type : selectedMoon?.type ?? solarPlanet.type}</p></div></div>
            {selectedMoon ? <div className="solar-data-grid"><div><span>母行星</span><b>{solarPlanet.name}</b></div><div><span>公轉週期</span><b>{Math.abs(selectedMoon.orbitalPeriodDays).toFixed(3)} 日{selectedMoon.orbitalPeriodDays < 0 ? " · 逆行" : ""}</b></div><div><span>平均軌道距離</span><b>{selectedMoon.orbitDistanceKm.toLocaleString()} km</b></div><div><span>半徑</span><b>{selectedMoon.radiusEarth} R⊕</b></div></div> : isHalleySelected ? <div className="solar-data-grid"><div><span>近日點</span><b>{halleyComet.perihelionAu} AU</b></div><div><span>遠日點</span><b>{halleyComet.aphelionAu} AU</b></div><div><span>平均週期</span><b>76.1 年</b></div><div><span>軌道離心率</span><b>{halleyComet.eccentricity}</b></div></div> : <div className="solar-data-grid"><div><span>平均距離</span><b>{solarPlanet.au} AU</b></div><div><span>公轉週期</span><b>{solarPlanet.periodDays.toLocaleString()} 日</b></div><div><span>半徑</span><b>{solarPlanet.radiusEarth} R⊕</b></div><div><span>已知衛星</span><b>{solarPlanet.moons}</b></div></div>}
            <div className="solar-climate"><span>{selectedMoon ? "主要成分" : isHalleySelected ? "彗核／下次回歸" : "溫度概況"}</span><b>{selectedMoon ? selectedMoon.composition : isHalleySelected ? `${halleyComet.nucleus} · ${halleyComet.nextReturn}` : solarPlanet.temperature}</b></div>
            <p className={selectedMoon ? "solar-summary moon-summary" : "solar-summary"}>{selectedMoon ? <><span>生命條件模型 {selectedMoon.bioScore}%</span>{selectedMoon.state}。{selectedMoon.bioPrediction}</> : isHalleySelected ? halleyComet.summary : solarPlanet.summary}</p>
            <div className="planet-picker" aria-label="選擇太陽系星體">{solarBodies.map((body) => <button key={body.id} className={body.id === solarPlanetId ? "active" : ""} onClick={() => setSolarPlanetId(body.id)}><i style={{ background: body.color, boxShadow: `0 0 9px ${body.accent}` }} /><span>{body.name}</span></button>)}<button className={isHalleySelected ? "active" : ""} onClick={() => setSolarPlanetId(halleyComet.id)}><i className="comet-dot" /><span>哈雷彗星</span></button></div>
            <p className="picker-label">FEATURED MOONS / 知名衛星</p>
            <div className="planet-picker moon-picker" aria-label="選擇知名衛星">{solarMoons.map((moon) => <button key={moon.id} className={moon.id === solarPlanetId ? "active" : ""} onClick={() => setSolarPlanetId(moon.id)}><i style={{ background: moon.color, boxShadow: `0 0 8px ${moon.accent}` }} /><span>{moon.name}</span><small>{solarBodies.find((body) => body.id === moon.parentId)?.name}</small></button>)}</div>
          </aside>
        </div>
      </section>

      <section className="observatory" id="observatory">
        <div className="observatory-head">
          <div><p className="eyebrow">LIVE SYSTEM / {system.id}</p><h1>{system.displayName ?? system.designation}</h1><p>{system.summary}</p></div>
          <div className="system-coordinates"><span>RA <b>{formatRa(system.raHours)}</b></span><span>DEC <b>{formatDec(system.decDeg)}</b></span><span>DIST <b>{system.distancePc.toFixed(1)} pc</b></span></div>
        </div>
        <div className="observatory-grid">
          <article className="system-viewport">
            <div className="viewport-toolbar"><div><i /> LIVE POSITION <span>{system.planets.length} PLANETS</span></div><div className="viewport-actions"><div className="mode-switch"><button className={mode === "live" ? "active" : ""} onClick={() => { setMode("live"); setSystemPaused(false); }}>即時位置</button><button className={mode === "animation" ? "active" : ""} onClick={() => setMode("animation")}>動畫預覽</button></div>{mode === "animation" && <div className="speed-switch">{[1, 6, 24].map((value) => <button key={value} className={systemSpeed === value ? "active" : ""} aria-pressed={systemSpeed === value} onClick={() => setSystemSpeed(value)}>{value}×</button>)}<button className={systemPaused ? "active" : ""} aria-pressed={systemPaused} onClick={() => setSystemPaused((value) => !value)}>{systemPaused ? "繼續" : "暫停"}</button></div>}</div></div>
            <OrbitCanvas system={system} selectedId={planet.id} onSelect={setPlanetId} mode={mode} speed={systemSpeed} paused={systemPaused} />
            <div className="viewport-foot"><span>視野：約 {Math.max(...system.planets.map((item) => item.semiMajorAu)).toFixed(2)} AU</span><span>比照太陽系的光影、軌道殘影與互動控制</span></div>
          </article>
          <aside className="planet-inspector">
            <div className="inspector-title"><span style={{ background: planet.orbitColor }} /><div><p>SELECTED BODY</p><h2>{planet.displayName ?? planet.code}</h2><small>{planet.type}</small></div></div>
            <div className="planet-metrics"><div><span>質量</span><b>{planet.massEarth.toFixed(2)} M⊕</b></div><div><span>半徑</span><b>{planet.radiusEarth.toFixed(2)} R⊕</b></div><div><span>公轉週期</span><b>{planet.periodDays.toFixed(2)} 日</b></div><div><span>平衡溫度</span><b>{planet.equilibriumTemp} K</b></div></div>
            <div className="data-block"><p>主要成分</p>{planet.composition.map((item) => <div className="composition" key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.value}%`, background: item.color }} /></i><strong>{item.value}%</strong></div>)}</div>
            <div className="data-block compact"><p>大氣與狀態</p><b>{planet.atmosphere}</b><small>{planet.state}</small></div>
            <div className="bio-card"><div><span>生物條件預測</span><b>{planet.bioScore}%</b></div><i><b style={{ width: `${planet.bioScore}%` }} /></i><p>{planet.bioPrediction}</p></div>
          </aside>
        </div>
      </section>

      <section className="discoveries" id="discoveries">
        <div className="section-title"><div><p className="eyebrow">PUBLISHED SYSTEMS</p><h2>最新發布的候選星系</h2></div><span>後台審核後公開 · 資料即時更新</span></div>
        <div className="system-list">
          {systems.map((item, index) => <button key={item.id} className={item.id === system.id ? "system-row active" : "system-row"} onClick={() => chooseSystem(item)}><span className="system-index">{String(index + 1).padStart(2, "0")}</span><span><b>{item.designation}</b><small>{item.classification}</small></span><span><b>{item.planets.length}</b><small>行星候選體</small></span><span><b>{item.confidence}%</b><small>模型信心</small></span><span><b>{item.distancePc.toFixed(1)} pc</b><small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("zh-TW") : "待發布"}</small></span><span>開啟星系 →</span></button>)}
        </div>
      </section>

      <section className="registry-section" id="registry">
        <div className="registry-copy"><p className="eyebrow">PRIVATE CELESTIAL REGISTRY</p><h2>把一個名字，<br /><em>留在它的軌道上。</em></h2><p>完成確認後，持有者會取得唯一恆星體系編號、個人化命名證書，以及依即時軌道資料生成的專屬動畫。</p><button onClick={() => setRegistryOpen(true)}>已有登錄編號？開啟專屬星系 →</button></div>
        <div className="package-list">{packages.map((item, index) => <article key={item.id} className={index === 1 ? "package-card featured" : "package-card"}><div><span>{item.name}</span>{index === 1 && <i>推薦</i>}</div><h3>NT$ {item.priceTwd.toLocaleString()}</h3><p>{item.description}</p><ul>{item.features.map((feature) => <li key={feature}>＋ {feature}</li>)}</ul><button onClick={() => { setOrderPlan(item); setOrderDone(null); }}>選擇此方案</button></article>)}</div>
      </section>

      <footer><div className="brand"><span className="brand-sigil small">N</span><span><b>NOCTUA</b><small>暗夜天體觀測台</small></span></div><p>科學模型輸出僅供教育、研究假設與私人紀念用途。紀念命名不是 IAU 官方命名。</p><a href="/admin">管理後台</a></footer>

      {orderPlan && <div className="modal-shell" onMouseDown={() => setOrderPlan(null)}><section className="order-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setOrderPlan(null)}>×</button>{orderDone ? <div className="order-success"><span>✓</span><p>登錄申請已建立</p><h2>{orderDone}</h2><small>付款確認後，管理員會核發專屬登錄編號與動畫入口。</small><button onClick={() => setOrderPlan(null)}>完成</button></div> : <form onSubmit={submitOrder}><p className="eyebrow">MEMORIAL ORDER</p><h2>{orderPlan.name}方案</h2><div className="order-target"><span>登錄目標</span><b>{system.designation} · {planet.code.split(" ").at(-1)}</b></div><label>紀念名稱<input name="desiredName" required maxLength={40} placeholder="例如 Asteria" /></label><label>持有者姓名<input name="ownerName" required maxLength={60} /></label><label>電子郵件<input name="email" required type="email" /></label><label>獻詞<textarea name="dedication" maxLength={240} rows={3} placeholder="想留在證書上的一句話" /></label><div className="demo-payment">目前為訂單與登錄流程；正式收款需接上金流服務。</div><button className="primary-action" type="submit">建立 NT$ {orderPlan.priceTwd.toLocaleString()} 登錄申請 →</button></form>}</section></div>}

      {registryOpen && <div className="modal-shell" onMouseDown={() => setRegistryOpen(false)}><section className={registry ? "owner-modal active" : "owner-modal"} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => { setRegistryOpen(false); setRegistry(null); }}>×</button>{!registry ? <form onSubmit={lookupRegistry}><p className="eyebrow">OWNER ACCESS</p><h2>開啟你的專屬星系</h2><p>輸入付款確認後取得的 NOCTUA 登錄編號。</p><label>登錄編號<input value={registryCode} onChange={(event) => setRegistryCode(event.target.value.toUpperCase())} required placeholder="NOR-XXXXXXXX" /></label>{registryError && <span className="form-error">{registryError}</span>}<button className="primary-action" type="submit">驗證並開啟 →</button></form> : <div className="owner-experience"><div className="owner-sky"><OrbitCanvas system={registry.system} selectedId={registry.system.planets[0].id} onSelect={() => undefined} mode="animation" ownerLabel={registry.order.desiredName} /></div><div className="owner-certificate"><p>NOCTUA PRIVATE REGISTRY</p><h2>{registry.order.desiredName}</h2><span>紀念登錄持有者 · {registry.order.ownerName}</span><div><small>專屬恆星體系編號</small><b>{registry.order.registryCode}</b><small>科學編號</small><b>{registry.system.designation}</b></div>{registry.order.dedication && <blockquote>「{registry.order.dedication}」</blockquote>}<button onClick={() => { setRegistry(null); setRegistryCode(""); }}>返回查詢</button></div></div>}</section></div>}
    </main>
  );
}

