"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import CelestialExplorer3D from "./components/CelestialExplorer3D";

type Composition = { label: string; value: number; color: string };
type Planet = {
  id: string; code: string; displayName: string | null; type: string; massEarth: number; radiusEarth: number;
  periodDays: number; semiMajorAu: number; eccentricity: number; equilibriumTemp: number; epochAngleDeg: number;
  orbitColor: string; composition: Composition[]; atmosphere: string; state: string; bioScore: number; bioPrediction: string; lifeSpeculation?: string;
};
type StarSystem = {
  id: string; designation: string; displayName: string | null; classification: string; raHours: number; decDeg: number;
  distancePc: number; starMass: number; starRadius: number; temperatureK: number; luminosity: number; ageByr: number;
  metallicity: number; confidence: number; summary: string; epochAt: string; publishedAt: string; planets: Planet[];
};
type NamingPackage = { id: string; name: string; priceTwd: number; description: string; features: string[] };
type Registry = {
  order: { registryCode: string; desiredName: string; ownerName: string; purchaserName: string; dedication: string; packageName: string };
  system: StarSystem;
  updates: { id: string; title: string; summary: string; observingNote: string; symbolicMeaning: string; publishedAt: string }[];
};
type ExplorerTarget = { system: StarSystem; planetId: string; ownerLabel?: string; registryCode?: string };
type RegistryShowcase = { sequence: number; desiredName: string; registryCode: string; systemId: string; systemDesignation: string; planetId: string; planetCode: string; confirmedAt: string; recordType: string };
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

const ORBIT_PREVIEW_DAYS_PER_SECOND = .45;
const DEMO_OWNER_REGISTRY_CODE = "NOR-DEMO2026";

const solarBodies: SolarBody[] = [
  { id: "mercury", name: "Mercury", english: "MERCURY", type: "Terrestrial planet", au: .387, periodDays: 87.969, radiusEarth: .383, color: "#8f8b84", accent: "#d6d0c5", epochAngle: 252.2503235, eccentricity: .20563593, perihelionLongitude: 77.45779628, temperature: "−180 to 430°C", moons: 0, summary: "The innermost planet: an ancient, cratered world shaped by extreme day–night temperatures." },
  { id: "venus", name: "Venus", english: "VENUS", type: "Terrestrial planet", au: .723, periodDays: 224.701, radiusEarth: .949, color: "#c98643", accent: "#ffe0a1", epochAngle: 181.9790995, eccentricity: .00677672, perihelionLongitude: 131.60246718, temperature: "Approx. 465°C", moons: 0, summary: "A dense carbon-dioxide atmosphere drives the hottest surface conditions in the Solar System." },
  { id: "earth", name: "Earth", english: "EARTH", type: "Ocean terrestrial planet", au: 1, periodDays: 365.256, radiusEarth: 1, color: "#2876a9", accent: "#80d5e8", epochAngle: 100.46457166, eccentricity: .01671123, perihelionLongitude: 102.93768193, temperature: "Average 15°C", moons: 1, summary: "The only world known to host life, with liquid oceans covering most of its surface." },
  { id: "mars", name: "Mars", english: "MARS", type: "Terrestrial planet", au: 1.524, periodDays: 686.98, radiusEarth: .532, color: "#a94d2f", accent: "#ef946c", epochAngle: -4.55343205, eccentricity: .0933941, perihelionLongitude: -23.94362959, temperature: "Average −63°C", moons: 2, summary: "A cold, arid world preserving valleys and minerals formed in the presence of ancient water." },
  { id: "jupiter", name: "Jupiter", english: "JUPITER", type: "Gas giant", au: 5.203, periodDays: 4332.589, radiusEarth: 11.21, color: "#b98b68", accent: "#f0d1a8", epochAngle: 34.39644051, eccentricity: .04838624, perihelionLongitude: 14.72847983, temperature: "Cloud tops approx. −110°C", moons: 101, summary: "The Solar System’s largest planet, defined by powerful magnetism and the Great Red Spot." },
  { id: "saturn", name: "Saturn", english: "SATURN", type: "Ringed gas giant", au: 9.537, periodDays: 10759.22, radiusEarth: 9.45, color: "#c7a56c", accent: "#ffe2a5", epochAngle: 49.95424423, eccentricity: .05386179, perihelionLongitude: 92.59887831, temperature: "Cloud tops approx. −140°C", moons: 274, summary: "An immense gas giant encircled by the Solar System’s most intricate icy ring structure." },
  { id: "uranus", name: "Uranus", english: "URANUS", type: "Ice giant", au: 19.19, periodDays: 30685.4, radiusEarth: 4.01, color: "#70b9bf", accent: "#c0f5ed", epochAngle: 313.23810451, eccentricity: .04725744, perihelionLongitude: 170.9542763, temperature: "Cloud tops approx. −195°C", moons: 28, summary: "A methane-blue ice giant rotating almost on its side relative to its orbital plane." },
  { id: "neptune", name: "Neptune", english: "NEPTUNE", type: "Ice giant", au: 30.07, periodDays: 60189, radiusEarth: 3.88, color: "#3559a8", accent: "#769cff", epochAngle: -55.12002969, eccentricity: .00859048, perihelionLongitude: 44.96476227, temperature: "Cloud tops approx. −200°C", moons: 16, summary: "The outermost major planet, with deep-blue clouds and the fastest winds in the Solar System." },
];

const solarMoons: SolarMoon[] = [
  { id: "moon", parentId: "earth", name: "The Moon", english: "THE MOON", type: "Rocky satellite", radiusEarth: .273, orbitalPeriodDays: 27.322, orbitDistanceKm: 384400, epochAngle: 218, color: "#aaa9a2", accent: "#eee9dc", composition: "Silicate crust · rocky mantle · iron-rich core", state: "Tidally locked · cratered highlands and ancient lava plains", bioScore: 2, bioPrediction: "No indigenous life is known; polar water ice may support future crewed activity." },
  { id: "phobos", parentId: "mars", name: "Phobos", english: "PHOBOS", type: "Irregular rocky satellite", radiusEarth: .00176, orbitalPeriodDays: .319, orbitDistanceKm: 9376, epochAngle: 61, color: "#77695b", accent: "#b7a28b", composition: "Porous rock · carbon-rich regolith candidate", state: "Extremely low orbit · slowly spiralling toward Mars", bioScore: 0, bioPrediction: "Without an atmosphere or stable liquid water, indigenous life is highly unlikely." },
  { id: "io", parentId: "jupiter", name: "Io", english: "IO", type: "Volcanic rocky satellite", radiusEarth: .286, orbitalPeriodDays: 1.769, orbitDistanceKm: 421700, epochAngle: 18, color: "#d9b04e", accent: "#fff0a0", composition: "Silicate rock · sulfur · sulfur dioxide", state: "The most volcanically active body in the Solar System", bioScore: 1, bioPrediction: "Intense radiation and continuous volcanism make known forms of life improbable." },
  { id: "europa", parentId: "jupiter", name: "Europa", english: "EUROPA", type: "Ice-shell ocean moon", radiusEarth: .245, orbitalPeriodDays: 3.551, orbitDistanceKm: 671100, epochAngle: 126, color: "#c8b48b", accent: "#eaf7ff", composition: "Water-ice shell · candidate saltwater ocean · rocky interior", state: "Tidal heating · fractured ice shell · strong evidence for a subsurface ocean", bioScore: 78, bioPrediction: "Its ocean may combine liquid water, chemical energy and water–rock interaction, making Europa a high-priority astrobiology target." },
  { id: "ganymede", parentId: "jupiter", name: "Ganymede", english: "GANYMEDE", type: "Large ice-rock satellite", radiusEarth: .413, orbitalPeriodDays: 7.155, orbitDistanceKm: 1070400, epochAngle: 224, color: "#8e8172", accent: "#c8d7dc", composition: "Water ice · silicate rock · metallic core", state: "Largest moon in the Solar System · intrinsic magnetic field · subsurface ocean", bioScore: 58, bioPrediction: "A deep ocean may contain habitable conditions, although ice thickness and energy sources remain uncertain." },
  { id: "callisto", parentId: "jupiter", name: "Callisto", english: "CALLISTO", type: "Ancient ice-rock satellite", radiusEarth: .378, orbitalPeriodDays: 16.689, orbitDistanceKm: 1882700, epochAngle: 314, color: "#615c55", accent: "#b9b4aa", composition: "Water ice · rock · candidate briny ocean", state: "Heavily cratered · comparatively low geological activity", bioScore: 43, bioPrediction: "A deep briny ocean may exist, but usable energy and material exchange appear limited." },
  { id: "enceladus", parentId: "saturn", name: "Enceladus", english: "ENCELADUS", type: "Plume-bearing ocean moon", radiusEarth: .0395, orbitalPeriodDays: 1.37, orbitDistanceKm: 238000, epochAngle: 81, color: "#dbe8e8", accent: "#ffffff", composition: "Water ice · salts · organics · rocky core", state: "Global subsurface ocean · south-polar ice and vapour plumes", bioScore: 82, bioPrediction: "Its plumes reveal water, heat and organic chemistry—making Enceladus one of the Solar System’s leading life-detection targets." },
  { id: "titan", parentId: "saturn", name: "Titan", english: "TITAN", type: "Atmosphere-rich icy moon", radiusEarth: .404, orbitalPeriodDays: 15.945, orbitDistanceKm: 1221870, epochAngle: 249, color: "#b77f34", accent: "#ffd58a", composition: "Nitrogen atmosphere · methane and ethane · water-ice crust", state: "Methane weather cycle · surface lakes and seas · candidate subsurface ocean", bioScore: 52, bioPrediction: "Both its surface chemistry and buried ocean are compelling, though life at such low temperatures remains highly speculative." },
  { id: "triton", parentId: "neptune", name: "Triton", english: "TRITON", type: "Retrograde icy satellite", radiusEarth: .212, orbitalPeriodDays: -5.877, orbitDistanceKm: 354800, epochAngle: 173, color: "#b7aca4", accent: "#d6f1f4", composition: "Nitrogen ice · methane ice · water ice and rock", state: "Retrograde orbit · likely a captured Kuiper Belt object", bioScore: 24, bioPrediction: "A deep ocean may persist, but temperature, energy sources and material exchange remain poorly constrained." },
];

const halleyComet = {
  id: "halley", name: "Halley’s Comet", english: "1P / HALLEY", type: "Periodic comet", periodDays: 76.1 * 365.25,
  perihelionAu: .5871, aphelionAu: 35.25, eccentricity: .967, nucleus: "Approx. 15 × 8 km",
  nextReturn: "2061", color: "#d9f7f3", accent: "#88dff2",
  summary: "A retrograde comet on a highly eccentric orbit. Near the Sun, sublimating ice forms dust and ion tails that stream away from the solar wind.",
};

const fallbackSystems: StarSystem[] = [{
  id: "SYS-NX-001", designation: "NOCTUA-X1", displayName: null, classification: "G8V yellow dwarf", raHours: 19.8464, decDeg: 8.8683,
  distancePc: 47.2, starMass: 0.91, starRadius: 0.94, temperatureK: 5480, luminosity: 0.72, ageByr: 5.1, metallicity: 0.08,
  confidence: 86, summary: "A four-planet candidate system supported by converging radial-velocity and transit signals.", epochAt: "2026-07-19T00:00:00.000Z", publishedAt: "2026-07-19T00:00:00.000Z",
  planets: [
    { id: "PL-NX-001-B", code: "NOCTUA-X1 b", displayName: null, type: "Lava terrestrial planet", massEarth: 1.7, radiusEarth: 1.19, periodDays: 8.42, semiMajorAu: .078, eccentricity: .03, equilibriumTemp: 982, epochAngleDeg: 34, orbitColor: "#d46b3c", composition: [{ label: "Silicates", value: 61, color: "#d97848" }, { label: "Iron–nickel core", value: 34, color: "#a8a9a7" }, { label: "Other", value: 5, color: "#617682" }], atmosphere: "Extremely thin sodium–oxygen exosphere", state: "Tidally locked · intense volcanic activity", bioScore: 1, bioPrediction: "Surface temperatures are too high for known forms of life." },
    { id: "PL-NX-001-C", code: "NOCTUA-X1 c", displayName: null, type: "Warm super-Earth", massEarth: 4.8, radiusEarth: 1.73, periodDays: 46.2, semiMajorAu: .244, eccentricity: .07, equilibriumTemp: 421, epochAngleDeg: 158, orbitColor: "#dfaa62", composition: [{ label: "Rocky mantle", value: 58, color: "#c58b5d" }, { label: "Metallic core", value: 26, color: "#a8a9a7" }, { label: "Water / ice", value: 16, color: "#6d9ec7" }], atmosphere: "Candidate nitrogen, carbon dioxide and water vapour", state: "High-pressure greenhouse · possible seasonal cycle", bioScore: 22, bioPrediction: "Temperate layers may exist high in the atmosphere, but no direct biosignature is known." },
    { id: "PL-NX-001-D", code: "NOCTUA-X1 d", displayName: null, type: "Habitable-zone ocean candidate", massEarth: 2.3, radiusEarth: 1.34, periodDays: 126.4, semiMajorAu: .478, eccentricity: .12, equilibriumTemp: 286, epochAngleDeg: 242, orbitColor: "#72b6c9", composition: [{ label: "Silicates", value: 43, color: "#bd8b63" }, { label: "Water / ice", value: 39, color: "#6ab6d5" }, { label: "Iron–nickel", value: 18, color: "#a8a9a7" }], atmosphere: "Candidate nitrogen, water vapour and trace methane", state: "Liquid-water conditions possible · stable model", bioScore: 61, bioPrediction: "Liquid water and usable energy gradients may coexist; spectroscopy is required to test for biosignatures." },
    { id: "PL-NX-001-E", code: "NOCTUA-X1 e", displayName: null, type: "Cold gas giant", massEarth: 128, radiusEarth: 9.2, periodDays: 682, semiMajorAu: 1.47, eccentricity: .19, equilibriumTemp: 163, epochAngleDeg: 306, orbitColor: "#9c8fc4", composition: [{ label: "Hydrogen / helium", value: 79, color: "#d3c6a4" }, { label: "Ices", value: 16, color: "#87a9c5" }, { label: "Heavy elements", value: 5, color: "#9a826f" }], atmosphere: "Hydrogen, helium and methane", state: "Stable outer cloud decks · large moons possible", bioScore: 8, bioPrediction: "The planet itself is inhospitable; large moons could preserve subsurface oceans." },
  ],
}];

const fallbackPackages: NamingPackage[] = [
  { id: "PKG-EXPLORER", name: "Explorer", priceTwd: 680, description: "A private memorial registry for one candidate planet", features: ["Digital naming certificate", "Live orbital animation", "Unique planetary designation"] },
  { id: "PKG-OBSERVER", name: "Observer", priceTwd: 1280, description: "A star and its complete candidate planetary system", features: ["Unique stellar-system registry", "4K system animation", "Annual position update"] },
  { id: "PKG-ARCHIVIST", name: "Archivist", priceTwd: 2680, description: "A complete archival record with bespoke presentation", features: ["Print-ready archival certificate", "Custom dedication", "Full orbit and composition report"] },
];

function formatRa(hours: number) {
  const h = Math.floor(hours); const min = Math.floor((hours - h) * 60); const sec = (((hours - h) * 60 - min) * 60).toFixed(1);
  return `${String(h).padStart(2, "0")}h ${String(min).padStart(2, "0")}m ${sec}s`;
}

function formatDec(value: number) { return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(4)}°`; }

function describeSpeculativeLife(planet: Planet) {
  if (planet.lifeSpeculation) return planet.lifeSpeculation;
  if (planet.bioScore >= 55) return "Creative analogue: a water-rich biosphere could favour streamlined, fish-person-like amphibious beings. This is imaginative morphology, not evidence of intelligent life.";
  if (planet.equilibriumTemp > 500) return "Creative analogue: a heat-shielded, xenomorph-like armoured crawler might shelter below the surface. No actual creature is predicted or observed.";
  return "The least speculative possibility is microbial life. Any animal-like description is creative visualisation rather than an astronomical discovery.";
}

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
    let intersectionObserver: IntersectionObserver | null = null;
    let visible = true;
    let previousDrawAt = 0;
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || time - previousDrawAt < 1000 / 30) return;
      previousDrawAt = time;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const previous = previousTimeRef.current ?? time;
      const deltaSeconds = Math.min((time - previous) / 1000, .1);
      previousTimeRef.current = time;
      if (mode === "animation" && !paused && !reduceMotion) simulationDaysRef.current += deltaSeconds * speed * ORBIT_PREVIEW_DAYS_PER_SECOND;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width; const h = rect.height; const cx = w * .5; const cy = h * .51;
      const space = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .78);
      space.addColorStop(0, "#0c2032"); space.addColorStop(.42, "#061322"); space.addColorStop(1, "#01050b");
      ctx.fillStyle = space; ctx.fillRect(0, 0, w, h);

      const nebula = ctx.createRadialGradient(w * .16, h * .18, 0, w * .16, h * .18, w * .55);
      nebula.addColorStop(0, "rgba(40,94,139,.17)"); nebula.addColorStop(.5, "rgba(33,49,92,.06)"); nebula.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula; ctx.fillRect(0, 0, w, h);
      paintStarField(ctx, w, h, reduceMotion ? 0 : time, Math.max(90, Math.floor(w * h / 5200)));

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
      for (let index = 0; index < 180; index += 1) {
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
        ctx.rotate(Math.PI / 9); ctx.strokeStyle = `rgba(255,174,64,${.06 + (ray % 3) * .025})`;
        ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(34 + (ray % 4) * 5, 0); ctx.stroke();
      }
      ctx.restore();
      const sun = ctx.createRadialGradient(cx - 7, cy - 8, 2, cx, cy, 22);
      sun.addColorStop(0, "#fffce3"); sun.addColorStop(.36, "#ffe285"); sun.addColorStop(.74, "#ff9e32"); sun.addColorStop(1, "#d95718");
      ctx.fillStyle = sun; ctx.shadowColor = "#ffb53f"; ctx.shadowBlur = 26; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,222,148,.72)";
      for (let spot = 0; spot < 7; spot += 1) { const a = time * .00012 + spot * 2.31; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (5 + spot % 3 * 3), cy + Math.sin(a * .77) * 9, .7 + spot % 2, 0, Math.PI * 2); ctx.fill(); }

      positionsRef.current = [];
      const observationTime = Date.now() + simulationDaysRef.current * 86400000;
      const daysSinceJ2000 = (observationTime - Date.parse("2000-01-01T12:00:00.000Z")) / 86400000;
      const selectedMoonBody = solarMoons.find((moon) => moon.id === selectedId);
      solarBodies.forEach((body, index) => {
        const bodyActive = body.id === selectedId || selectedMoonBody?.parentId === body.id;
        const orbit = orbitRadius(body.au);
        const meanLongitude = (body.epochAngle + daysSinceJ2000 / body.periodDays * 360) * Math.PI / 180;
        const perihelion = body.perihelionLongitude * Math.PI / 180;
        const meanAnomaly = meanLongitude - perihelion;
        let eccentricAnomaly = meanAnomaly;
        for (let iteration = 0; iteration < 7; iteration += 1) eccentricAnomaly -= (eccentricAnomaly - body.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / (1 - body.eccentricity * Math.cos(eccentricAnomaly));
        const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + body.eccentricity) * Math.sin(eccentricAnomaly / 2), Math.sqrt(1 - body.eccentricity) * Math.cos(eccentricAnomaly / 2));
        const angle = trueAnomaly + perihelion;
        const visualDistance = orbit * (1 - body.eccentricity * Math.cos(eccentricAnomaly));
        const point = transformPoint(angle, visualDistance);
        const radius = Math.max(3.3, Math.min(12.5, 3.1 + Math.log2(body.radiusEarth + 1) * 2.45));
        positionsRef.current.push({ id: body.id, x: point.x, y: point.y, radius: radius + 10 });

        ctx.strokeStyle = `${body.accent}${bodyActive ? "90" : "32"}`; ctx.lineWidth = bodyActive ? 2 : .8;
        ctx.beginPath(); ctx.ellipse(cx, cy, orbit, orbit * flatten, tilt, angle - (bodyActive ? .72 : .22), angle); ctx.stroke();

        if (body.id === "saturn" || body.id === "uranus") {
          ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(body.id === "uranus" ? 1.12 : -.19);
          ctx.strokeStyle = body.id === "saturn" ? "rgba(229,205,154,.72)" : "rgba(161,222,221,.42)";
          ctx.lineWidth = body.id === "saturn" ? 3.2 : 1.4; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.9, radius * .48, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }

        const sphere = ctx.createRadialGradient(point.x - radius * .4, point.y - radius * .42, radius * .08, point.x, point.y, radius * 1.1);
        sphere.addColorStop(0, body.accent); sphere.addColorStop(.48, body.color); sphere.addColorStop(1, "#07101a");
        ctx.fillStyle = sphere; ctx.shadowColor = body.accent; ctx.shadowBlur = bodyActive ? 22 : 7;
        ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        if (body.radiusEarth > 3) {
          ctx.save(); ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.clip();
          ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = Math.max(.7, radius * .1);
          for (let band = -2; band <= 2; band += 1) { ctx.beginPath(); ctx.moveTo(point.x - radius, point.y + band * radius * .3); ctx.lineTo(point.x + radius, point.y + band * radius * .3); ctx.stroke(); }
          ctx.restore();
        }
        const parentMoons = solarMoons.filter((moon) => moon.parentId === body.id);
        const farthestMoonKm = Math.max(1, ...parentMoons.map((moon) => moon.orbitDistanceKm));
        parentMoons.forEach((moon) => {
          const moonOrbit = radius + 7 + Math.pow(moon.orbitDistanceKm / farthestMoonKm, .36) * (body.radiusEarth > 3 ? 24 : 15);
          const moonAngle = (moon.epochAngle + daysSinceJ2000 / moon.orbitalPeriodDays * 360) * Math.PI / 180;
          const moonX = point.x + Math.cos(moonAngle) * moonOrbit;
          const moonY = point.y + Math.sin(moonAngle) * moonOrbit * .54;
          const moonRadius = Math.max(1.45, Math.min(3.5, 1.25 + Math.sqrt(moon.radiusEarth) * 3.4));
          const moonSelected = moon.id === selectedId;
          ctx.strokeStyle = moonSelected ? `${moon.accent}a8` : "rgba(181,205,216,.13)"; ctx.lineWidth = moonSelected ? 1.15 : .55;
          ctx.beginPath(); ctx.ellipse(point.x, point.y, moonOrbit, moonOrbit * .54, 0, 0, Math.PI * 2); ctx.stroke();
          const moonSphere = ctx.createRadialGradient(moonX - moonRadius * .4, moonY - moonRadius * .4, .2, moonX, moonY, moonRadius * 1.2);
          moonSphere.addColorStop(0, moon.accent); moonSphere.addColorStop(.5, moon.color); moonSphere.addColorStop(1, "#111820");
          ctx.fillStyle = moonSphere; ctx.shadowColor = moon.accent; ctx.shadowBlur = moonSelected ? 15 : 4;
          ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          if (moonSelected) { const pulse = moonRadius + 5 + Math.sin((reduceMotion ? 0 : time) / 250) * 1.5; ctx.strokeStyle = "rgba(241,249,250,.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(moonX, moonY, pulse, 0, Math.PI * 2); ctx.stroke(); }
          positionsRef.current.push({ id: moon.id, x: moonX, y: moonY, radius: Math.max(7, moonRadius + 5) });
          if (moonSelected || bodyActive || ["moon", "europa", "enceladus", "titan", "triton"].includes(moon.id)) {
            ctx.fillStyle = moonSelected ? "#f4fbfc" : "rgba(184,205,216,.68)"; ctx.font = `${moonSelected ? "600" : "400"} 7px ui-monospace, monospace`;
            ctx.fillText(moon.name, moonX + moonRadius + 3, moonY - moonRadius - 2);
          }
        });

        if (bodyActive) {
          const pulse = radius + 7 + Math.sin((reduceMotion ? 0 : time) / 260) * 2;
          ctx.strokeStyle = "rgba(236,247,255,.82)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(point.x, point.y, pulse, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = `${body.accent}45`; ctx.beginPath(); ctx.arc(point.x, point.y, pulse + 5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = bodyActive ? "#f4f9fb" : "rgba(184,205,216,.64)";
        ctx.font = `${bodyActive ? "600" : "400"} 9px ui-monospace, monospace`;
        const labelX = point.x > cx ? point.x + radius + 7 : point.x - radius - 7 - ctx.measureText(body.name).width;
        ctx.fillText(body.name, labelX, point.y - radius - 3);
        if (body.id === selectedId) {
          ctx.fillStyle = "rgba(132,163,181,.7)"; ctx.font = "7px ui-monospace, monospace";
          ctx.fillText(`${body.au.toFixed(body.au < 10 ? 3 : 2)} AU`, labelX, point.y - radius + 8);
        }
      });

      const cometDx = halleyPosition.x - cx; const cometDy = halleyPosition.y - cy;
      const cometDistance = Math.max(1, Math.hypot(cometDx, cometDy));
      const tailDirectionX = cometDx / cometDistance; const tailDirectionY = cometDy / cometDistance;
      const nearSunFactor = 1 - Math.min(1, cometDistance / (maxOrbit * 1.08));
      const ionTailLength = 30 + nearSunFactor * 82; const dustTailLength = 22 + nearSunFactor * 57;
      ctx.save(); ctx.lineCap = "round";
      for (let stream = 0; stream < 7; stream += 1) {
        const spread = (stream - 3) * (1.5 + nearSunFactor * 1.8);
        ctx.strokeStyle = `rgba(113,217,244,${.08 + nearSunFactor * .07})`; ctx.lineWidth = Math.max(.7, 3.2 - stream * .28);
        ctx.beginPath(); ctx.moveTo(halleyPosition.x, halleyPosition.y);
        ctx.quadraticCurveTo(halleyPosition.x + tailDirectionX * ionTailLength * .45 - tailDirectionY * spread, halleyPosition.y + tailDirectionY * ionTailLength * .45 + tailDirectionX * spread, halleyPosition.x + tailDirectionX * ionTailLength - tailDirectionY * spread * 2.2, halleyPosition.y + tailDirectionY * ionTailLength + tailDirectionX * spread * 2.2); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,202,128,${.14 + nearSunFactor * .2})`; ctx.lineWidth = 5 + nearSunFactor * 7;
      ctx.beginPath(); ctx.moveTo(halleyPosition.x, halleyPosition.y);
      ctx.quadraticCurveTo(halleyPosition.x + tailDirectionX * dustTailLength * .42 + tailDirectionY * 8, halleyPosition.y + tailDirectionY * dustTailLength * .42 - tailDirectionX * 8, halleyPosition.x + tailDirectionX * dustTailLength + tailDirectionY * 17, halleyPosition.y + tailDirectionY * dustTailLength - tailDirectionX * 17); ctx.stroke();
      ctx.restore();
      const coma = ctx.createRadialGradient(halleyPosition.x - 1, halleyPosition.y - 1, 0, halleyPosition.x, halleyPosition.y, 12 + nearSunFactor * 7);
      coma.addColorStop(0, "rgba(255,255,236,1)"); coma.addColorStop(.18, "rgba(173,239,237,.92)"); coma.addColorStop(.5, "rgba(92,207,226,.28)"); coma.addColorStop(1, "rgba(62,173,213,0)");
      ctx.fillStyle = coma; ctx.beginPath(); ctx.arc(halleyPosition.x, halleyPosition.y, 12 + nearSunFactor * 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#27333a"; ctx.shadowColor = "#b8f7f1"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(halleyPosition.x, halleyPosition.y, 3.8, 2.4, -.45, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (selectedId === halleyComet.id) { const cometPulse = 12 + Math.sin((reduceMotion ? 0 : time) / 250) * 2; ctx.strokeStyle = "rgba(202,249,250,.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(halleyPosition.x, halleyPosition.y, cometPulse, 0, Math.PI * 2); ctx.stroke(); }
      positionsRef.current.push({ id: halleyComet.id, x: halleyPosition.x, y: halleyPosition.y, radius: 16 });
      ctx.fillStyle = selectedId === halleyComet.id ? "#d9fbfb" : "rgba(165,219,225,.72)"; ctx.font = `${selectedId === halleyComet.id ? "600" : "400"} 9px ui-monospace, monospace`;
      ctx.fillText("1P / HALLEY", halleyPosition.x + 10, halleyPosition.y - 10);

      ctx.fillStyle = "rgba(137,167,184,.5)"; ctx.font = "8px ui-monospace, monospace";
      const ephemerisLabel = mode === "live" ? "LIVE UTC" : `SIM +${simulationDaysRef.current.toFixed(1)} DAYS`;
      ctx.fillText(`REAL-TIME EPHEMERIS · ${new Date(observationTime).toISOString().slice(0, 19)} UTC · ${ephemerisLabel}`, 18, h - 17);
    };
    observer = new ResizeObserver(() => undefined); observer.observe(canvas);
    intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "120px" }); intersectionObserver.observe(canvas);
    frame = requestAnimationFrame(draw);
    const click = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      const hit = [...positionsRef.current].reverse().find((position) => Math.hypot(position.x - x, position.y - y) <= position.radius);
      if (hit) selectRef.current(hit.id);
    };
    const move = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      canvas.style.cursor = positionsRef.current.some((position) => Math.hypot(position.x - x, position.y - y) <= position.radius) ? "pointer" : "crosshair";
    };
    canvas.addEventListener("click", click); canvas.addEventListener("mousemove", move);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); intersectionObserver?.disconnect(); canvas.removeEventListener("click", click); canvas.removeEventListener("mousemove", move); };
  }, [selectedId, mode, speed, paused]);

  return <canvas ref={canvasRef} className="solar-canvas" aria-label="Live approximate positions of the Sun, eight planets, nine featured moons and Halley’s Comet; select a body to inspect it" />;
}

function OrbitCanvas({ system, selectedId, onSelect, mode, ownerLabel, speed = 1, paused = false }: { system: StarSystem; selectedId: string; onSelect: (id: string) => void; mode: "live" | "animation"; ownerLabel?: string; speed?: number; paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<{ id: string; x: number; y: number; radius: number }[]>([]);
  const simulationDaysRef = useRef(0);
  const previousTimeRef = useRef<number | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let visible = true;
    let previousDrawAt = 0;
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || time - previousDrawAt < 1000 / 30) return;
      previousDrawAt = time;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const previous = previousTimeRef.current ?? time;
      const deltaSeconds = Math.min((time - previous) / 1000, .1);
      previousTimeRef.current = time;
      if (mode === "animation" && !paused && !reduceMotion) simulationDaysRef.current += deltaSeconds * speed * ORBIT_PREVIEW_DAYS_PER_SECOND;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width; const h = rect.height; const cx = w * .49; const cy = h * .5;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .72);
      gradient.addColorStop(0, "#102b3c"); gradient.addColorStop(.42, "#071827"); gradient.addColorStop(1, "#02070d");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      paintStarField(ctx, w, h, reduceMotion ? 0 : time, Math.max(70, Math.floor(w * h / 5600)));
      const scan = ctx.createLinearGradient(0, 0, 0, h);
      scan.addColorStop(0, "rgba(80,151,188,.02)"); scan.addColorStop(.5, "rgba(80,151,188,.08)"); scan.addColorStop(.501, "rgba(80,151,188,.015)"); scan.addColorStop(1, "rgba(80,151,188,.02)");
      ctx.fillStyle = scan; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(135,174,194,.065)"; ctx.lineWidth = 1;
      const grid = 48;
      for (let x = cx % grid; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = cy % grid; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const maxOrbit = Math.min(w * .42, h * .43); const maxAu = Math.max(...system.planets.map((planet) => planet.semiMajorAu), 1);
      const habitableInner = 48 + Math.sqrt(Math.min(.8 * Math.sqrt(system.luminosity), maxAu) / maxAu) * (maxOrbit - 48);
      const habitableOuter = 48 + Math.sqrt(Math.min(1.5 * Math.sqrt(system.luminosity), maxAu) / maxAu) * (maxOrbit - 48);
      ctx.save(); ctx.strokeStyle = "rgba(78,183,142,.06)"; ctx.lineWidth = Math.max(4, (habitableOuter - habitableInner) * .55); ctx.beginPath();
      ctx.ellipse(cx, cy, (habitableInner + habitableOuter) * .5, (habitableInner + habitableOuter) * .28, -.18, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      positionsRef.current = [];
      ctx.setLineDash([2, 6]);
      system.planets.forEach((planet) => {
        const orbit = 48 + Math.sqrt(planet.semiMajorAu / maxAu) * (maxOrbit - 48);
        ctx.strokeStyle = planet.id === selectedId ? `${planet.orbitColor}aa` : "rgba(132,164,181,.2)";
        ctx.lineWidth = planet.id === selectedId ? 1.6 : .8; ctx.beginPath(); ctx.ellipse(cx, cy, orbit, orbit * .56, -.18, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]);
      const starRadius = 9 + system.starRadius * 5;
      const starPulse = 1 + Math.sin((reduceMotion ? 0 : time) / 680) * .045;
      const corona = ctx.createRadialGradient(cx, cy, starRadius * .2, cx, cy, starRadius * 4.2 * starPulse);
      corona.addColorStop(0, "rgba(255,246,194,1)"); corona.addColorStop(.24, "rgba(255,190,75,.78)"); corona.addColorStop(.6, "rgba(255,117,34,.16)"); corona.addColorStop(1, "rgba(255,102,24,0)");
      ctx.fillStyle = corona; ctx.beginPath(); ctx.arc(cx, cy, starRadius * 4.2 * starPulse, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(time * .00005);
      for (let ray = 0; ray < 14; ray += 1) { ctx.rotate(Math.PI / 7); ctx.strokeStyle = "rgba(255,181,74,.11)"; ctx.beginPath(); ctx.moveTo(starRadius * 1.25, 0); ctx.lineTo(starRadius * (1.8 + ray % 3 * .25), 0); ctx.stroke(); }
      ctx.restore();
      const stellarSurface = ctx.createRadialGradient(cx - starRadius * .35, cy - starRadius * .38, 1, cx, cy, starRadius);
      stellarSurface.addColorStop(0, "#fffde3"); stellarSurface.addColorStop(.42, "#ffe18a"); stellarSurface.addColorStop(.78, "#ff9d35"); stellarSurface.addColorStop(1, "#ce4b18");
      ctx.shadowColor = "#ffd37a"; ctx.shadowBlur = 26; ctx.fillStyle = stellarSurface; ctx.beginPath(); ctx.arc(cx, cy, starRadius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(180,83,34,.26)";
      for (let spot = 0; spot < 5; spot += 1) { const spotAngle = (reduceMotion ? 0 : time) * .00011 + spot * 1.71; ctx.beginPath(); ctx.arc(cx + Math.cos(spotAngle) * starRadius * .48, cy + Math.sin(spotAngle * .83) * starRadius * .42, .7 + spot % 2, 0, Math.PI * 2); ctx.fill(); }
      const elapsedDays = (Date.now() - new Date(system.epochAt).getTime()) / 86400000;
      system.planets.forEach((planet, index) => {
        const orbit = 48 + Math.sqrt(planet.semiMajorAu / maxAu) * (maxOrbit - 48);
        const degrees = mode === "live" ? planet.epochAngleDeg + elapsedDays / planet.periodDays * 360 : planet.epochAngleDeg + simulationDaysRef.current / planet.periodDays * 360;
        const angle = degrees * Math.PI / 180;
        const x = cx + Math.cos(angle) * orbit * Math.cos(.18) - Math.sin(angle) * orbit * .56 * Math.sin(-.18);
        const y = cy + Math.cos(angle) * orbit * Math.sin(-.18) + Math.sin(angle) * orbit * .56 * Math.cos(.18);
        const radius = Math.max(4, Math.min(10, 3 + Math.log2(planet.radiusEarth + 1) * 2));
        positionsRef.current.push({ id: planet.id, x, y, radius: radius + 7 });
        ctx.strokeStyle = `${planet.orbitColor}${planet.id === selectedId ? "9c" : "35"}`; ctx.lineWidth = planet.id === selectedId ? 1.8 : .7;
        ctx.beginPath(); ctx.ellipse(cx, cy, orbit, orbit * .56, -.18, angle - (planet.id === selectedId ? .82 : .24), angle); ctx.stroke();
        if (planet.radiusEarth > 6) { ctx.save(); ctx.translate(x, y); ctx.rotate(-.22); ctx.strokeStyle = `${planet.orbitColor}72`; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.8, radius * .48, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        const sphere = ctx.createRadialGradient(x - radius * .42, y - radius * .42, radius * .06, x, y, radius * 1.18);
        sphere.addColorStop(0, "#f5f0df"); sphere.addColorStop(.28, planet.orbitColor); sphere.addColorStop(1, "#06101a");
        ctx.fillStyle = sphere; ctx.shadowColor = planet.orbitColor; ctx.shadowBlur = planet.id === selectedId ? 22 : 8;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        if (planet.radiusEarth > 5) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip(); ctx.strokeStyle = "rgba(255,255,255,.19)"; for (let band = -2; band <= 2; band += 1) { ctx.beginPath(); ctx.moveTo(x - radius, y + band * radius * .28); ctx.lineTo(x + radius, y + band * radius * .28); ctx.stroke(); } ctx.restore(); }
        if (planet.radiusEarth > 4) { const moonAngle = (reduceMotion ? 0 : time) * .0012 + index; ctx.fillStyle = "#c9d4d5"; ctx.beginPath(); ctx.arc(x + Math.cos(moonAngle) * (radius + 5), y + Math.sin(moonAngle) * (radius + 5), 1.1, 0, Math.PI * 2); ctx.fill(); }
        if (planet.id === selectedId) { ctx.strokeStyle = "rgba(255,255,255,.76)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, radius + 7 + Math.sin((reduceMotion ? 0 : time) / 250) * 2, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = planet.id === selectedId ? "#eef6f7" : "rgba(181,204,216,.58)"; ctx.font = `${planet.id === selectedId ? "600" : "400"} 10px ui-monospace, monospace`; ctx.fillText(ownerLabel && index === 0 ? ownerLabel : planet.code.split(" ").at(-1) ?? "", x + radius + 6, y - radius - 3);
      });
      ctx.fillStyle = "rgba(148,179,194,.46)"; ctx.font = "9px ui-monospace, monospace"; ctx.fillText(`REAL-TIME EPHEMERIS · ${new Date().toISOString().slice(0, 19)} UTC`, 18, h - 18);
    };
    observer = new ResizeObserver(() => undefined); observer.observe(canvas);
    intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "120px" }); intersectionObserver.observe(canvas);
    frame = requestAnimationFrame(draw);
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
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); intersectionObserver?.disconnect(); canvas.removeEventListener("click", click); canvas.removeEventListener("mousemove", move); };
  }, [system, selectedId, mode, ownerLabel, speed, paused]);

  return <canvas ref={canvasRef} className="orbit-canvas" aria-label={`${system.designation} live orbital map; select a planet for details`} />;
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
  const [orderBusy, setOrderBusy] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryCode, setRegistryCode] = useState("");
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [registryError, setRegistryError] = useState("");
  const [explorerTarget, setExplorerTarget] = useState<ExplorerTarget | null>(null);
  const [registryShowcase, setRegistryShowcase] = useState<RegistryShowcase[]>([]);

  useEffect(() => {
    fetch("/api/public/systems").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      if (data.systems?.length) { setSystems(data.systems); setSystemId(data.systems[0].id); setPlanetId(data.systems[0].planets[0]?.id ?? ""); }
      if (data.packages?.length) setPackages(data.packages);
      if (data.registryShowcase?.length >= 50) setRegistryShowcase(data.registryShowcase);
    }).catch(() => undefined);
    const holderCode = new URLSearchParams(window.location.search).get("registry")?.trim().toUpperCase();
    if (holderCode) fetch(`/api/public/registry?code=${encodeURIComponent(holderCode)}`).then(async (response) => ({ response, data: await response.json() })).then(({ response, data }) => {
      if (response.ok) { setRegistryCode(holderCode); setRegistry(data.registry); setRegistryOpen(true); }
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
    setOrderBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ packageId: orderPlan.id, systemId: system.id, planetId: planet.id, desiredName: form.get("desiredName"), purchaserName: form.get("purchaserName"), ownerName: form.get("ownerName"), email: form.get("email"), recipientEmail: form.get("recipientEmail"), dedication: form.get("dedication"), lifetimeConsent: form.get("lifetimeConsent") === "on" }) });
    const data = await response.json();
    if (!response.ok) { setOrderBusy(false); return window.alert(data.error ?? "Unable to create the registry order."); }
    if (data.checkoutUrl) return window.location.assign(data.checkoutUrl);
    setOrderBusy(false); setOrderDone(data.order.id);
  }

  async function loadRegistry(code: string) {
    setRegistryError(""); setRegistry(null);
    const response = await fetch(`/api/public/registry?code=${encodeURIComponent(code)}`); const data = await response.json();
    if (!response.ok) return setRegistryError(data.error ?? "Registry lookup failed.");
    setRegistry(data.registry);
  }

  async function lookupRegistry(event: FormEvent) {
    event.preventDefault();
    await loadRegistry(registryCode);
  }

  async function openDemoRegistry() {
    setRegistryCode(DEMO_OWNER_REGISTRY_CODE);
    await loadRegistry(DEMO_OWNER_REGISTRY_CODE);
  }

  return (
    <main className="public-site">
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-sigil">N</span><span><b>NOCTUA</b><small>CELESTIAL RESEARCH LAB</small></span></a>
        <nav><a href="#solar-system">Solar System</a><a href="#observatory">Candidate Systems</a><a href="#registry-archive">Registry Archive</a><a href="#registry">Private Registry</a><a href="/guide">How It Works</a><a href="/resources">Institutions</a><button onClick={() => setRegistryOpen(true)}>Holder Access</button></nav>
        <button className="holder-header-action" onClick={() => setRegistryOpen(true)}>OPEN REGISTRY ↗</button>
      </header>
      <div className="science-banner"><b>MODEL CANDIDATE</b> Candidate systems are model-derived, not confirmed discoveries. Positions are computed from reference epochs and orbital periods.</div>

      <section className="solar-showcase" id="solar-system">
        <div className="solar-intro" id="top">
          <div><p className="eyebrow">HOME SYSTEM / LIVE SIMULATION</p><h1>Begin with our Sun.<br /><em>Watch a living system unfold.</em></h1></div>
          <div className="solar-intro-copy"><p>An interactive Solar System calculated from the J2000 reference epoch, orbital periods and current UTC time. Select any planet, featured moon or Halley’s Comet to inspect its present position and environment.</p><div><span><i />Live ephemeris position</span><span>8 PLANETS · 9 FEATURED MOONS</span><span>1P / HALLEY</span></div></div>
        </div>
        <div className="observatory-credibility"><span><b>REAL-TIME</b> orbital ephemeris</span><span><b>MODEL-BASED</b> candidate classification</span><span><b>PRIVATE</b> memorial registry</span></div>
        <div className="solar-console">
          <article className="solar-stage">
            <div className="solar-toolbar">
              <div><span className="live-pulse" /> SOLAR ORBITAL VIEW <small>ORBITAL DISTANCES VISUALLY COMPRESSED</small></div>
              <div className="solar-controls">
                <button className={solarMode === "live" ? "active" : ""} aria-pressed={solarMode === "live"} onClick={() => { setSolarMode("live"); setSolarPaused(false); }}>LIVE POSITION</button>
                <button className={solarMode === "animation" ? "active" : ""} aria-pressed={solarMode === "animation"} onClick={() => setSolarMode("animation")}>ORBIT PREVIEW</button>
                {solarMode === "animation" && <>{[1, 6, 24].map((value) => <button key={value} className={solarSpeed === value ? "active" : ""} aria-pressed={solarSpeed === value} onClick={() => setSolarSpeed(value)}>{value}×</button>)}<button className={solarPaused ? "active pause" : "pause"} aria-pressed={solarPaused} onClick={() => setSolarPaused((value) => !value)}>{solarPaused ? "RESUME" : "PAUSE"}</button></>}
              </div>
            </div>
            <SolarSystemCanvas selectedId={solarPlanetId} onSelect={setSolarPlanetId} mode={solarMode} speed={solarSpeed} paused={solarPaused} />
            <div className="solar-foot"><span>J2000 REAL-TIME APPROXIMATION · MOON ORBITS ENLARGED</span><span>1× = 0.45 SIMULATED DAYS / SEC</span></div>
          </article>
          <aside className="solar-inspector">
            <div className="solar-planet-title"><span className={isHalleySelected ? "comet-orb" : isMoonSelected ? "moon-orb" : ""} style={{ "--planet-color": isHalleySelected ? halleyComet.color : selectedMoon?.color ?? solarPlanet.color, "--planet-accent": isHalleySelected ? halleyComet.accent : selectedMoon?.accent ?? solarPlanet.accent } as React.CSSProperties} /><div><small>{isHalleySelected ? halleyComet.english : selectedMoon?.english ?? solarPlanet.english} / SELECTED</small><h2>{isHalleySelected ? halleyComet.name : selectedMoon?.name ?? solarPlanet.name}</h2><p>{isHalleySelected ? halleyComet.type : selectedMoon?.type ?? solarPlanet.type}</p></div></div>
            {selectedMoon ? <div className="solar-data-grid"><div><span>Parent planet</span><b>{solarPlanet.name}</b></div><div><span>Orbital period</span><b>{Math.abs(selectedMoon.orbitalPeriodDays).toFixed(3)} days{selectedMoon.orbitalPeriodDays < 0 ? " · retrograde" : ""}</b></div><div><span>Mean orbit distance</span><b>{selectedMoon.orbitDistanceKm.toLocaleString()} km</b></div><div><span>Radius</span><b>{selectedMoon.radiusEarth} R⊕</b></div></div> : isHalleySelected ? <div className="solar-data-grid"><div><span>Perihelion</span><b>{halleyComet.perihelionAu} AU</b></div><div><span>Aphelion</span><b>{halleyComet.aphelionAu} AU</b></div><div><span>Mean period</span><b>76.1 years</b></div><div><span>Eccentricity</span><b>{halleyComet.eccentricity}</b></div></div> : <div className="solar-data-grid"><div><span>Mean distance</span><b>{solarPlanet.au} AU</b></div><div><span>Orbital period</span><b>{solarPlanet.periodDays.toLocaleString()} days</b></div><div><span>Radius</span><b>{solarPlanet.radiusEarth} R⊕</b></div><div><span>Known moons</span><b>{solarPlanet.moons}</b></div></div>}
            <div className="solar-climate"><span>{selectedMoon ? "PRIMARY COMPOSITION" : isHalleySelected ? "NUCLEUS / NEXT RETURN" : "TEMPERATURE PROFILE"}</span><b>{selectedMoon ? selectedMoon.composition : isHalleySelected ? `${halleyComet.nucleus} · ${halleyComet.nextReturn}` : solarPlanet.temperature}</b></div>
            <p className={selectedMoon ? "solar-summary moon-summary" : "solar-summary"}>{selectedMoon ? <><span>ASTROBIOLOGY MODEL {selectedMoon.bioScore}%</span>{selectedMoon.state}. {selectedMoon.bioPrediction}</> : isHalleySelected ? halleyComet.summary : solarPlanet.summary}</p>
            <div className="planet-picker" aria-label="Select a Solar System body">{solarBodies.map((body) => <button key={body.id} className={body.id === solarPlanetId ? "active" : ""} onClick={() => setSolarPlanetId(body.id)}><i style={{ background: body.color, boxShadow: `0 0 9px ${body.accent}` }} /><span>{body.name}</span></button>)}<button className={isHalleySelected ? "active" : ""} onClick={() => setSolarPlanetId(halleyComet.id)}><i className="comet-dot" /><span>Halley</span></button></div>
            <p className="picker-label">FEATURED MOONS</p>
            <div className="planet-picker moon-picker" aria-label="Select a featured moon">{solarMoons.map((moon) => <button key={moon.id} className={moon.id === solarPlanetId ? "active" : ""} onClick={() => setSolarPlanetId(moon.id)}><i style={{ background: moon.color, boxShadow: `0 0 8px ${moon.accent}` }} /><span>{moon.name}</span><small>{solarBodies.find((body) => body.id === moon.parentId)?.name}</small></button>)}</div>
          </aside>
        </div>
      </section>

      <section className="observatory" id="observatory">
        <div className="observatory-head">
          <div><p className="eyebrow">LIVE SYSTEM / {system.id}</p><h1>{system.displayName ?? system.designation}</h1><code className="complete-designation">FULL DESIGNATION · {system.id} / {system.designation}</code><p>{system.summary}</p></div>
          <div className="system-coordinates"><span>RA <b>{formatRa(system.raHours)}</b></span><span>DEC <b>{formatDec(system.decDeg)}</b></span><span>DIST <b>{system.distancePc.toFixed(1)} pc</b></span></div>
        </div>
        <div className="observatory-grid">
          <article className="system-viewport">
            <div className="viewport-toolbar"><div><i /> LIVE POSITION <span>{system.planets.length} PLANETS</span></div><div className="viewport-actions"><div className="mode-switch"><button className={mode === "live" ? "active" : ""} onClick={() => { setMode("live"); setSystemPaused(false); }}>LIVE POSITION</button><button className={mode === "animation" ? "active" : ""} onClick={() => setMode("animation")}>ORBIT PREVIEW</button></div>{mode === "animation" && <div className="speed-switch">{[1, 6, 24].map((value) => <button key={value} className={systemSpeed === value ? "active" : ""} aria-pressed={systemSpeed === value} onClick={() => setSystemSpeed(value)}>{value}×</button>)}<button className={systemPaused ? "active" : ""} aria-pressed={systemPaused} onClick={() => setSystemPaused((value) => !value)}>{systemPaused ? "RESUME" : "PAUSE"}</button></div>}</div></div>
            <OrbitCanvas system={system} selectedId={planet.id} onSelect={setPlanetId} mode={mode} speed={systemSpeed} paused={systemPaused} />
            <div className="viewport-foot"><span>FIELD OF VIEW: APPROX. {Math.max(...system.planets.map((item) => item.semiMajorAu)).toFixed(2)} AU</span><span>SLOW PREVIEW · 1× = 0.45 SIMULATED DAYS / SEC</span></div>
          </article>
          <aside className="planet-inspector">
            <div className="inspector-title"><span style={{ background: planet.orbitColor }} /><div><p>SELECTED BODY / {planet.id}</p><h2>{planet.displayName ?? planet.code}</h2><code>{system.id} / {system.designation} / {planet.id} / {planet.code}</code><small>{planet.type}</small></div></div>
            <div className="planet-metrics"><div><span>Mass</span><b>{planet.massEarth.toFixed(2)} M⊕</b></div><div><span>Radius</span><b>{planet.radiusEarth.toFixed(2)} R⊕</b></div><div><span>Orbital period</span><b>{planet.periodDays.toFixed(2)} days</b></div><div><span>Equilibrium temp.</span><b>{planet.equilibriumTemp} K</b></div></div>
            <div className="data-block"><p>PRIMARY COMPOSITION</p>{planet.composition.map((item) => <div className="composition" key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.value}%`, background: item.color }} /></i><strong>{item.value}%</strong></div>)}</div>
            <div className="data-block compact"><p>ATMOSPHERE & STATE</p><b>{planet.atmosphere}</b><small>{planet.state}</small></div>
            <div className="bio-card"><div><span>ASTROBIOLOGY FORECAST</span><b>{planet.bioScore}%</b></div><i><b style={{ width: `${planet.bioScore}%` }} /></i><p>{planet.bioPrediction}</p></div>
            <div className="life-form-card"><span>SPECULATIVE LIFE MORPHOLOGY</span><p>{describeSpeculativeLife(planet)}</p><small>Creative environmental analogy only · not an observed organism or biosignature.</small></div>
            <button className="open-3d-explorer" onClick={() => setExplorerTarget({ system, planetId: planet.id })}><span>IMMERSIVE CELESTIAL EXPLORATION</span><b>OPEN 3D VIEW ↗</b></button>
          </aside>
        </div>
      </section>

      <section className="discoveries" id="discoveries">
        <div className="section-title"><div><p className="eyebrow">PUBLISHED SYSTEMS</p><h2>Recently released candidates</h2></div><span>REVIEWED BEFORE PUBLICATION · LIVE DATA</span></div>
        <div className="system-list">
          {systems.map((item, index) => <button key={item.id} className={item.id === system.id ? "system-row active" : "system-row"} onClick={() => chooseSystem(item)}><span className="system-index">{String(index + 1).padStart(2, "0")}</span><span><b>{item.designation}</b><small>{item.classification}</small></span><span><b>{item.planets.length}</b><small>PLANET CANDIDATES</small></span><span><b>{item.confidence}%</b><small>MODEL CONFIDENCE</small></span><span><b>{item.distancePc.toFixed(1)} pc</b><small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-GB") : "PENDING"}</small></span><span>OPEN SYSTEM →</span></button>)}
        </div>
      </section>

      <section className="registry-showcase" id="registry-archive">
        <div className="registry-showcase-head">
          <div><p className="eyebrow">PUBLIC REGISTRY SHOWCASE / 50 RECORDS</p><h2>Names placed<br /><em>into the NOCTUA archive.</em></h2></div>
          <div><b>{String(registryShowcase.length || 50).padStart(2, "0")}</b><span>DEMONSTRATION CELESTIAL NAMES</span><p>These fictional showcase records demonstrate the completed registry format. They are not claims of real customer payments or official astronomical ownership.</p></div>
        </div>
        <div className="registry-showcase-grid" aria-label="Fifty demonstration celestial registry names">
          {registryShowcase.map((entry) => <article key={entry.registryCode}>
            <span>{String(entry.sequence).padStart(2, "0")}</span>
            <div><h3>{entry.desiredName}</h3><code>{entry.registryCode}</code></div>
            <div><small>COMPLETE SYSTEM</small><b>{entry.systemId} / {entry.systemDesignation}</b><small>REGISTERED BODY</small><b>{entry.planetId} / {entry.planetCode}</b></div>
            <time dateTime={entry.confirmedAt}>{new Date(entry.confirmedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</time>
          </article>)}
        </div>
      </section>

      <section className="registry-section" id="registry">
        <div className="registry-copy"><p className="eyebrow">ONE LIFE / ONE PRIVATE REGISTRY</p><h2>Place a name<br /><em>into lasting orbit.</em></h2><p>Each person may purchase only once in their lifetime, for someone who truly matters. The giver and recipient share one stellar-system number, a personalised certificate, a dedicated 3D animation and every future research update.</p><a className="registry-guide-link" href="/guide">DISCOVER HOW THE ONE-LIFE REGISTRY WORKS →</a><button onClick={() => setRegistryOpen(true)}>HAVE A REGISTRY NUMBER? OPEN YOUR SYSTEM →</button></div>
        <div className="package-list">{packages.map((item, index) => <article key={item.id} className={index === 1 ? "package-card featured" : "package-card"}><div><span>{item.name}</span>{index === 1 && <i>RECOMMENDED</i>}</div><h3>NT$ {item.priceTwd.toLocaleString()}</h3><p>{item.description}</p><ul>{item.features.map((feature) => <li key={feature}>＋ {feature}</li>)}</ul><button onClick={() => { setOrderPlan(item); setOrderDone(null); setOrderBusy(false); }}>SELECT THIS PLAN</button></article>)}</div>
      </section>

      <footer><div className="brand"><span className="brand-sigil small">N</span><span><b>NOCTUA</b><small>CELESTIAL RESEARCH LAB</small></span></div><p>Model outputs are provided for education, research hypotheses and private memorial use. Private registry names are not official IAU designations.</p><div className="footer-links"><a href="/guide">How it works</a><a href="/resources">Astronomy institutions</a></div></footer>

      {orderPlan && <div className="modal-shell" onMouseDown={() => !orderBusy && setOrderPlan(null)}><section className="order-modal gift-order-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" disabled={orderBusy} onClick={() => setOrderPlan(null)}>×</button>{orderDone ? <div className="order-success"><span>✓</span><p>REGISTRY ORDER CREATED</p><h2>{orderDone}</h2><small>Your unique registry number and animation access will be issued after payment confirmation.</small><button onClick={() => setOrderPlan(null)}>DONE</button></div> : <form onSubmit={submitOrder}><p className="eyebrow">ONE LIFE / ONE CELESTIAL GIFT</p><h2>{orderPlan.name} Plan</h2><div className="lifetime-order-note"><b>ONE PURCHASE, FOR A LIFETIME</b><span>Every purchaser may create one NOCTUA registry in their lifetime—reserved for someone who truly matters.</span></div><div className="order-target"><span>REGISTRY TARGET</span><b>{system.designation} · {planet.code.split(" ").at(-1)}</b></div><label>Memorial name<input name="desiredName" required maxLength={40} placeholder="e.g. Asteria" /></label><div className="gift-field-grid"><label>Your full name<input name="purchaserName" required maxLength={60} autoComplete="name" /></label><label>Your email<input name="email" required type="email" autoComplete="email" /></label><label>Recipient’s full name<input name="ownerName" required maxLength={60} /></label><label>Recipient’s email<input name="recipientEmail" required type="email" /></label></div><label>Dedication<textarea name="dedication" maxLength={240} rows={3} placeholder="A sentence to preserve for the person receiving this star" /></label><label className="lifetime-confirm"><input name="lifetimeConsent" required type="checkbox" /><span>I understand that I may purchase only once in my lifetime, and that this registry is a private symbolic gift rather than an official IAU designation.</span></label><div className="secure-payment"><div><span>SECURE CHECKOUT</span><b>ECPay</b></div><p>Credit card · ATM · convenience-store code · mobile payment</p><small>Payment details are entered on ECPay’s encrypted page. NOCTUA never receives or stores your card number.</small></div><button className="primary-action" type="submit" disabled={orderBusy}>{orderBusy ? "PREPARING SECURE CHECKOUT…" : `PROCEED TO PAYMENT · NT$ ${orderPlan.priceTwd.toLocaleString()} →`}</button><p className="payment-terms">Your contribution supports continued modelling and research updates for the registered system.</p></form>}</section></div>}

      {registryOpen && <div className="modal-shell" onMouseDown={() => setRegistryOpen(false)}><section className={registry ? "owner-modal active" : "owner-modal"} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => { setRegistryOpen(false); setRegistry(null); }}>×</button>{!registry ? <form onSubmit={lookupRegistry}><p className="eyebrow">HOLDER ACCESS</p><h2>Open your private system</h2><p>Enter the NOCTUA registry number shared with both the purchaser and recipient after payment confirmation.</p><div className="demo-owner-account"><div><span>DEMO HOLDER ACCOUNT</span><b>Asteria Noctua</b><small>Example holder · Starlight archive</small></div><code>{DEMO_OWNER_REGISTRY_CODE}</code><button type="button" onClick={openDemoRegistry}>OPEN DEMO SYSTEM →</button></div><div className="owner-account-divider"><span>OR USE A HOLDER REGISTRY NUMBER</span></div><label>Registry number<input value={registryCode} onChange={(event) => setRegistryCode(event.target.value.toUpperCase())} required placeholder="NOR-XXXXXXXX" /></label>{registryError && <span className="form-error">{registryError}</span>}<button className="primary-action" type="submit">VERIFY & OPEN →</button></form> : <div className="owner-experience"><div className="owner-sky"><OrbitCanvas system={registry.system} selectedId={registry.system.planets[0].id} onSelect={() => undefined} mode="animation" ownerLabel={registry.order.desiredName} /></div><div className="owner-certificate"><p>NOCTUA PRIVATE REGISTRY</p><h2>{registry.order.desiredName}</h2><span>GIFTED BY {registry.order.purchaserName} · FOR {registry.order.ownerName}</span><div><small>UNIQUE STELLAR-SYSTEM REGISTRY</small><b>{registry.order.registryCode}</b><small>SCIENTIFIC DESIGNATION</small><b>{registry.system.designation}</b></div>{registry.order.dedication && <blockquote>“{registry.order.dedication}”</blockquote>}<div className="holder-update-feed"><div className="holder-update-head"><span>RESEARCH UPDATE ARCHIVE</span><a href={`/guide?system=${encodeURIComponent(registry.system.id)}`}>VIEWING GUIDE ↗</a></div>{registry.updates.length ? registry.updates.slice(0, 3).map((update) => <article key={update.id}><small>{new Date(update.publishedAt).toLocaleDateString("en-GB")}</small><b>{update.title}</b><p>{update.summary}</p><em>{update.symbolicMeaning}</em></article>) : <p className="holder-update-empty">New progress will appear here for both the purchaser and recipient.</p>}</div><button className="owner-3d-button" onClick={() => setExplorerTarget({ system: registry.system, planetId: registry.system.planets[0].id, ownerLabel: registry.order.desiredName, registryCode: registry.order.registryCode })}>OPEN PRIVATE SYSTEM IN 3D ↗</button><button onClick={() => { setRegistry(null); setRegistryCode(""); }}>BACK TO LOOKUP</button></div></div>}</section></div>}

      {explorerTarget && <CelestialExplorer3D system={explorerTarget.system} initialPlanetId={explorerTarget.planetId} ownerLabel={explorerTarget.ownerLabel} registryCode={explorerTarget.registryCode} onClose={() => setExplorerTarget(null)} />}
    </main>
  );
}
