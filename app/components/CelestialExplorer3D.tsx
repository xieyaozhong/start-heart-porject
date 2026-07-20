"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ExplorerPlanet = {
  id: string;
  code: string;
  displayName: string | null;
  type: string;
  massEarth: number;
  radiusEarth: number;
  periodDays: number;
  semiMajorAu: number;
  equilibriumTemp: number;
  epochAngleDeg: number;
  orbitColor: string;
  composition: { label: string; value: number; color: string }[];
  atmosphere: string;
  state: string;
  bioScore: number;
  bioPrediction: string;
  lifeSpeculation?: string;
};

export type ExplorerSystem = {
  id: string;
  designation: string;
  displayName: string | null;
  classification: string;
  distancePc: number;
  temperatureK: number;
  luminosity: number;
  epochAt: string;
  planets: ExplorerPlanet[];
};

type ViewMode = "planet" | "system" | "star";

type Props = {
  system: ExplorerSystem;
  initialPlanetId: string;
  ownerLabel?: string;
  registryCode?: string;
  onClose: () => void;
};

const PREVIEW_DAYS_PER_SECOND = 0.45;

function colorWithLightness(hex: string, lightness: number) {
  const color = new THREE.Color(hex);
  color.offsetHSL(0, 0, lightness);
  return `#${color.getHexString()}`;
}

function planetTexture(planet: ExplorerPlanet, resolution = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = Math.round(resolution / 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const base = planet.orbitColor;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colorWithLightness(base, 0.18));
  gradient.addColorStop(0.42, base);
  gradient.addColorStop(1, colorWithLightness(base, -0.22));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gaseous = /gas|giant|neptune|jovian/i.test(planet.type);
  const oceanic = /ocean|water/i.test(planet.type) || planet.composition.some((item) => /water/i.test(item.label) && item.value >= 30);
  const molten = /lava|molten|hot/i.test(planet.type) || planet.equilibriumTemp > 650;
  const icy = /ice|frozen|cold/i.test(planet.type) && !gaseous;
  let seed = [...planet.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  if (gaseous) {
    for (let band = 0; band < (resolution <= 320 ? 24 : 34); band += 1) {
      const y = random() * canvas.height;
      const height = 2 + random() * 17;
      ctx.fillStyle = `${colorWithLightness(base, random() * 0.32 - 0.16)}${Math.floor(35 + random() * 55).toString(16).padStart(2, "0")}`;
      ctx.fillRect(0, y, canvas.width, height);
    }
  } else if (oceanic) {
    ctx.fillStyle = colorWithLightness(base, -0.1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let continent = 0; continent < (resolution <= 320 ? 24 : 38); continent += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radius = 8 + random() * 38;
      ctx.fillStyle = `rgba(${35 + Math.floor(random() * 30)},${92 + Math.floor(random() * 45)},${72 + Math.floor(random() * 38)},${.28 + random() * .32})`;
      ctx.beginPath(); ctx.ellipse(x, y, radius * (1.2 + random()), radius * .42, random() * .8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(238,249,255,.34)"; ctx.lineWidth = Math.max(1, resolution / 280);
    for (let cloud = 0; cloud < 12; cloud += 1) { const y = random() * canvas.height; ctx.beginPath(); ctx.moveTo(-10, y); ctx.bezierCurveTo(canvas.width * .3, y - 14, canvas.width * .65, y + 18, canvas.width + 10, y - 4); ctx.stroke(); }
  } else if (molten) {
    ctx.fillStyle = "#24100d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,102,29,.9)"; ctx.lineWidth = Math.max(1.4, resolution / 190); ctx.shadowColor = "#ff6b23"; ctx.shadowBlur = resolution / 45;
    for (let fissure = 0; fissure < (resolution <= 320 ? 24 : 38); fissure += 1) {
      let x = random() * canvas.width; let y = random() * canvas.height;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let segment = 0; segment < 5; segment += 1) { x += (random() - .5) * resolution * .08; y += (random() - .5) * resolution * .05; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else if (icy) {
    ctx.fillStyle = colorWithLightness(base, .18); ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(224,248,255,.52)"; ctx.lineWidth = Math.max(1, resolution / 320);
    for (let fracture = 0; fracture < 28; fracture += 1) { const x = random() * canvas.width; const y = random() * canvas.height; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (random() - .5) * resolution * .16, y + (random() - .5) * resolution * .1); ctx.stroke(); }
  } else {
    for (let mark = 0; mark < (resolution <= 320 ? 48 : 76); mark += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radius = 3 + random() * 34;
      ctx.fillStyle = `${colorWithLightness(base, random() * 0.38 - 0.19)}${Math.floor(18 + random() * 50).toString(16).padStart(2, "0")}`;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * (1.2 + random()), radius * 0.42, random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function orbitRadius(au: number) {
  return 1.15 + Math.log1p(Math.max(au, 0.02) * 7.5) * 1.48;
}

function createStars(scene: THREE.Scene, lowPower: boolean) {
  const count = lowPower ? 520 : 1100;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 28 + Math.random() * 85;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const tint = Math.random();
    colors[index * 3] = tint > 0.88 ? 0.62 : 0.9;
    colors[index * 3 + 1] = tint > 0.88 ? 0.79 : 0.94;
    colors[index * 3 + 2] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: lowPower ? 0.1 : 0.075, vertexColors: true, transparent: true, opacity: 0.82, sizeAttenuation: true });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

function createStar(scene: THREE.Scene, temperatureK: number, large = false, radiusScale = 1) {
  const warm = temperatureK < 5200;
  const color = warm ? 0xffa83d : temperatureK > 6800 ? 0x9fc9ff : 0xffd180;
  const group = new THREE.Group();
  const stellarRadius = (large ? 1.55 : 0.42) * radiusScale;
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(stellarRadius, large ? 48 : 32, large ? 48 : 32),
    new THREE.MeshBasicMaterial({ color }),
  );
  group.add(star);
  for (let layer = 1; layer <= 3; layer += 1) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(stellarRadius * (1 + layer * 0.12), 28, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 / layer, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
    );
    group.add(glow);
  }
  const light = new THREE.PointLight(color, large ? 75 : 42, large ? 55 : 32, 1.2);
  group.add(light);
  scene.add(group);
  return group;
}

function createBinaryOrbitPath(scene: THREE.Scene, radius: number, lowPower: boolean) {
  const segments = lowPower ? 48 : 72;
  const path = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: segments }, (_, index) => {
      const angle = index / segments * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * .38);
    })),
    new THREE.LineBasicMaterial({ color: 0xd99543, transparent: true, opacity: .28 }),
  );
  scene.add(path);
}

function createFigureEightOrbitPath(scene: THREE.Scene, radius: number, lowPower: boolean) {
  const segments = lowPower ? 72 : 120;
  const path = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: segments }, (_, index) => {
      const phase = index / segments * Math.PI * 2;
      return new THREE.Vector3(Math.sin(phase) * radius, 0, Math.sin(phase) * Math.cos(phase) * radius * .58);
    })),
    new THREE.LineBasicMaterial({ color: 0x78bfd2, transparent: true, opacity: .34 }),
  );
  scene.add(path);
}

function createOrbitalDust(scene: THREE.Scene, radius: number, color: number, lowPower: boolean) {
  const count = lowPower ? 90 : 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const phase = index / count * Math.PI * 2;
    const spread = ((index * 37) % 19) / 19 - .5;
    const particleRadius = radius * (1 + spread * .42);
    positions[index * 3] = Math.cos(phase) * particleRadius;
    positions[index * 3 + 1] = Math.sin(index * 2.17) * radius * .045;
    positions[index * 3 + 2] = Math.sin(phase) * particleRadius * .48;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: lowPower ? .028 : .038, transparent: true, opacity: .48, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);
  return dust;
}

function createNebulaShell(scene: THREE.Scene, large: boolean, lowPower: boolean) {
  const group = new THREE.Group();
  const radius = large ? 3.2 : 1.12;
  [0x5d8cff, 0x8d5fd3, 0x4fc8d5, 0x9bd7ff].forEach((color,index) => {
    const shell = new THREE.Mesh(new THREE.TorusGeometry(radius * (1 + index * .2), .035 + index * .01, 8, lowPower ? 64 : 112), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .19 - index * .028, depthWrite: false, blending: THREE.AdditiveBlending }));
    shell.rotation.set(.55 + index * .35,.25 + index * .5,index * .7); group.add(shell);
  });
  const particleCount = lowPower ? 140 : 360;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const palette = [new THREE.Color(0x6f9dff), new THREE.Color(0xa270e5), new THREE.Color(0x5dd4dc)];
  for (let index = 0; index < particleCount; index += 1) {
    const longitude = index * 2.3999632297;
    const vertical = 1 - 2 * ((index + .5) / particleCount);
    const radial = radius * (1.25 + ((index * 29) % 31) / 34);
    const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    positions[index * 3] = Math.cos(longitude) * horizontal * radial;
    positions[index * 3 + 1] = vertical * radial * .42;
    positions[index * 3 + 2] = Math.sin(longitude) * horizontal * radial;
    const tint = palette[index % palette.length];
    colors[index * 3] = tint.r; colors[index * 3 + 1] = tint.g; colors[index * 3 + 2] = tint.b;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  group.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: large ? .055 : .026, vertexColors: true, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })));
  scene.add(group); return group;
}

function createPulsarFeatures(scene: THREE.Scene, large: boolean, lowPower: boolean) {
  const group = new THREE.Group();
  const length = large ? 8 : 3.2;
  const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xaee5ff, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const forwardBeam = new THREE.Mesh(new THREE.CylinderGeometry(.012, .22, length, lowPower ? 12 : 20, 1, true), beamMaterial);
  forwardBeam.position.y = length / 2; group.add(forwardBeam);
  const reverseBeam = forwardBeam.clone(); reverseBeam.position.y = -length / 2; reverseBeam.rotation.z = Math.PI; group.add(reverseBeam);
  [0, 1].forEach((index) => {
    const field = new THREE.Mesh(new THREE.TorusGeometry((large ? 2.3 : .82) * (1 + index * .38), .018, 8, lowPower ? 64 : 96), new THREE.MeshBasicMaterial({ color: index ? 0x967cff : 0x73bfff, transparent: true, opacity: .38 - index * .12, depthWrite: false, blending: THREE.AdditiveBlending }));
    field.rotation.set(1.12 + index * .34, index * .55, index * .28); group.add(field);
  });
  const sparkCount = lowPower ? 42 : 92;
  const sparkPositions = new Float32Array(sparkCount * 3);
  for (let index = 0; index < sparkCount; index += 1) {
    const phase = index / sparkCount * Math.PI * 8;
    const y = (index / (sparkCount - 1) - .5) * length * 1.8;
    const radius = (large ? .2 : .07) * (1 + Math.abs(y) / length);
    sparkPositions[index * 3] = Math.cos(phase) * radius;
    sparkPositions[index * 3 + 1] = y;
    sparkPositions[index * 3 + 2] = Math.sin(phase) * radius;
  }
  const sparkGeometry = new THREE.BufferGeometry(); sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
  group.add(new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: 0xd9f5ff, size: large ? .055 : .025, transparent: true, opacity: .78, depthWrite: false, blending: THREE.AdditiveBlending })));
  group.rotation.z = .72;
  scene.add(group); return group;
}

function createBlackHoleModel(scene: THREE.Scene, large: boolean, lowPower: boolean) {
  const group = new THREE.Group();
  const radius = large ? 1.28 : .34;
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius,40,40),new THREE.MeshBasicMaterial({ color:0x000000 })));
  const discGroup = new THREE.Group();
  const discColors = [0xffd080, 0xff8a43, 0xe4525a, 0x8740b6];
  discColors.forEach((color, index) => {
    const inner = radius * (1.32 + index * .48);
    const disc = new THREE.Mesh(new THREE.RingGeometry(inner, inner + radius * (.58 - index * .07), lowPower ? 64 : 128), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: .62 - index * .1, depthWrite: false, blending: THREE.AdditiveBlending }));
    disc.userData.baseOpacity = .62 - index * .1; discGroup.add(disc);
  });
  const particleCount = lowPower ? 80 : 190;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const phase = index / particleCount * Math.PI * 2;
    const particleRadius = radius * (1.42 + ((index * 17) % 53) / 25);
    particlePositions[index * 3] = Math.cos(phase) * particleRadius;
    particlePositions[index * 3 + 1] = Math.sin(index * 1.73) * radius * .035;
    particlePositions[index * 3 + 2] = Math.sin(phase) * particleRadius;
  }
  const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  discGroup.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xffc36c, size: large ? .055 : .022, transparent: true, opacity: .82, depthWrite: false, blending: THREE.AdditiveBlending })));
  discGroup.rotation.x = 1.28; group.add(discGroup);
  const lens = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.12,.032,12,lowPower ? 64 : 112),new THREE.MeshBasicMaterial({ color:0xd293ff,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending }));
  lens.rotation.x = .72; group.add(lens);
  const jets = new THREE.Group();
  [-1, 1].forEach((direction) => {
    const jet = new THREE.Mesh(new THREE.ConeGeometry(radius * .18, radius * 4.8, lowPower ? 12 : 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x9d76ff, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    jet.position.y = direction * radius * 2.55; if (direction < 0) jet.rotation.z = Math.PI; jets.add(jet);
  });
  jets.rotation.z = -.22; group.add(jets);
  group.userData.accretionDisc = discGroup; group.userData.lens = lens; group.userData.jets = jets;
  group.add(new THREE.PointLight(0xb469ff,large ? 38 : 20,large ? 28 : 14,1.4)); scene.add(group); return group;
}

export default function CelestialExplorer3D({ system, initialPlanetId, ownerLabel, registryCode, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(1);
  const pausedRef = useRef(false);
  const [view, setView] = useState<ViewMode>("planet");
  const [selectedId, setSelectedId] = useState(initialPlanetId);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showHabitable, setShowHabitable] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const systemMeshesRef = useRef(new Map<string, THREE.Mesh>());

  const selected = useMemo(() => system.planets.find((planet) => planet.id === selectedId) ?? system.planets[0], [selectedId, system]);
  const isBinarySystem = system.id === "SYS-NX-BIN-021" || /binary/i.test(system.classification);
  const isWhiteDwarfSystem = system.id === "SYS-NX-WD-031" || /white dwarf/i.test(system.classification);
  const isRedGiantSystem = system.id === "SYS-NX-RG-044" || /red giant/i.test(system.classification);
  const isTripleSystem = system.id === "SYS-NX-TRI-052" || /three-star|triple-star/i.test(system.classification);
  const isBlueGiantSystem = system.id === "SYS-NX-BG-061" || /blue supergiant/i.test(system.classification);
  const isPulsarSystem = system.id === "SYS-NX-PSR-067" || /pulsar|neutron-star/i.test(system.classification);
  const isBlackHoleSystem = system.id === "SYS-NX-BH-073" || /black hole/i.test(system.classification);
  const isDoublePlanetSystem = system.id === "SYS-NX-DP-081" || /double-planet/i.test(system.classification);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    systemMeshesRef.current.forEach((mesh, planetId) => {
      const active = planetId === selectedId;
      mesh.scale.setScalar(active ? 1.24 : 1);
      const material = mesh.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissive.set(active ? String(mesh.userData.planetColor) : "#000000");
        material.emissiveIntensity = active ? 0.18 : 0;
      }
    });
  }, [selectedId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !selected) return;
    setWebglError(false);
    setModelReady(false);
    systemMeshesRef.current.clear();
    const compact = window.matchMedia("(max-width: 720px)").matches;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lowPower = compact || navigator.hardwareConcurrency <= 4 || memory <= 4;
    const binarySystem = isBinarySystem || isBlackHoleSystem;
    const tripleSystem = isTripleSystem;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setWebglError(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.35));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.replaceChildren(renderer.domElement);
    const onContextLost = (event: Event) => { event.preventDefault(); setModelReady(false); setWebglError(true); };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02070c, view === "system" ? 0.011 : 0.018);
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.05, 180);
    const stars = createStars(scene, lowPower);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.rotateSpeed = 0.48;
    controls.zoomSpeed = 0.72;

    const ambient = new THREE.AmbientLight(0x5f7690, 0.42);
    scene.add(ambient);
    const clock = new THREE.Clock();
    let animationFrame = 0;
    let firstFrame = true;
    let simulationDays = 0;
    const textures: THREE.Texture[] = [];
    const planetObjects: { data: ExplorerPlanet; mesh: THREE.Mesh; radius: number }[] = [];
    let featured: THREE.Mesh | undefined;
    let starGroup: THREE.Group | undefined;
    let companionStarGroup: THREE.Group | undefined;
    let tertiaryStarGroup: THREE.Group | undefined;
    let nebulaGroup: THREE.Group | undefined;
    let pulsarFeatureGroup: THREE.Group | undefined;
    let orbitalDust: THREE.Points | undefined;
    let mutualOrbitGroup: THREE.Group | undefined;
    let doublePlanetBridge: THREE.Line | undefined;
    let featuredAtmosphere: THREE.Mesh | undefined;

    if (view === "planet") {
      camera.position.set(0, 0.12, compact ? 6.4 : 5.15);
      controls.minDistance = 2.7;
      controls.maxDistance = 10;
      const texture = planetTexture(selected, lowPower ? 320 : 512);
      if (texture) textures.push(texture);
      featured = new THREE.Mesh(
        new THREE.SphereGeometry(1.62, lowPower ? 36 : 56, lowPower ? 36 : 56),
        new THREE.MeshStandardMaterial({ map: texture, color: texture ? 0xffffff : selected.orbitColor, roughness: 0.76, metalness: 0.04 }),
      );
      featured.rotation.z = -0.19;
      scene.add(featured);
      featuredAtmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.69, lowPower ? 32 : 48, lowPower ? 32 : 48),
        new THREE.MeshBasicMaterial({ color: colorWithLightness(selected.orbitColor, 0.24), transparent: true, opacity: 0.11, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
      );
      scene.add(featuredAtmosphere);
      const horizon = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, .018, 8, lowPower ? 72 : 128),
        new THREE.MeshBasicMaterial({ color: colorWithLightness(selected.orbitColor, .3), transparent: true, opacity: .44, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      horizon.rotation.set(1.08, .25, -.12); featuredAtmosphere.add(horizon);
      if (/gas|giant|neptune|jovian/i.test(selected.type)) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.03, 2.82, 128),
          new THREE.MeshBasicMaterial({ color: selected.orbitColor, side: THREE.DoubleSide, transparent: true, opacity: 0.24 }),
        );
        ring.rotation.x = 1.28;
        ring.rotation.z = -0.18;
        scene.add(ring);
      }
      const keyLight = new THREE.DirectionalLight(0xffe0ad, 5.5);
      keyLight.position.set(-4, 2.2, 4.2);
      scene.add(keyLight);
      const rim = new THREE.DirectionalLight(0x7ba7ff, 2.2);
      rim.position.set(4, -1, -3);
      scene.add(rim);
    }

    if (view === "system") {
      camera.position.set(compact ? 0 : 1.5, compact ? 9.7 : 8.2, compact ? 11.8 : 10.7);
      controls.target.set(0, 0, 0);
      controls.minDistance = 5;
      controls.maxDistance = 28;
      controls.maxPolarAngle = Math.PI * 0.76;
      starGroup = isBlackHoleSystem ? createBlackHoleModel(scene, false, lowPower) : createStar(scene, system.temperatureK, false, isPulsarSystem ? .2 : isWhiteDwarfSystem ? .44 : isBlueGiantSystem ? 1.75 : isRedGiantSystem ? 1.7 : 1);
      if (isBlueGiantSystem) nebulaGroup = createNebulaShell(scene, false, lowPower);
      if (isPulsarSystem) pulsarFeatureGroup = createPulsarFeatures(scene, false, lowPower);
      if (isBlueGiantSystem || isPulsarSystem || isBlackHoleSystem || isDoublePlanetSystem) {
        orbitalDust = createOrbitalDust(scene, isBlueGiantSystem ? 4.2 : isBlackHoleSystem ? 2.35 : 3.1, isBlackHoleSystem ? 0xff9857 : isDoublePlanetSystem ? 0x76e1ca : 0x78bfff, lowPower);
      }
      if (binarySystem) {
        companionStarGroup = createStar(scene, isBlackHoleSystem ? 4650 : Math.max(3900, system.temperatureK - 1250), false, .76);
        createBinaryOrbitPath(scene, .42, lowPower);
        createBinaryOrbitPath(scene, .62, lowPower);
      }
      if (tripleSystem) {
        companionStarGroup = createStar(scene, Math.max(4100, system.temperatureK - 900), false, .82);
        tertiaryStarGroup = createStar(scene, Math.max(3900, system.temperatureK - 1550), false, .64);
        createFigureEightOrbitPath(scene, 1.18, lowPower);
      }
      if (showHabitable) {
        const innerAu = Math.sqrt(Math.max(system.luminosity, 0.05) / 1.1);
        const outerAu = Math.sqrt(Math.max(system.luminosity, 0.05) / 0.53);
        const inner = orbitRadius(innerAu);
        const outer = orbitRadius(outerAu);
        const zone = new THREE.Mesh(
          new THREE.RingGeometry(inner, outer, lowPower ? 64 : 96),
          new THREE.MeshBasicMaterial({ color: 0x4fd7af, side: THREE.DoubleSide, transparent: true, opacity: 0.095, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        zone.rotation.x = -Math.PI / 2;
        scene.add(zone);
      }
      system.planets.forEach((planet) => {
        const radius = orbitRadius(planet.semiMajorAu);
        const path = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(Array.from({ length: lowPower ? 64 : 96 }, (_, index) => {
            const angle = index / (lowPower ? 64 : 96) * Math.PI * 2;
            return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
          })),
          new THREE.LineBasicMaterial({ color: planet.id === selectedId ? 0xffbf68 : 0x49616d, transparent: true, opacity: planet.id === selectedId ? 0.7 : 0.34 }),
        );
        scene.add(path);
        const bodySize = Math.min(0.22 + Math.sqrt(planet.radiusEarth) * 0.055, 0.62);
        const texture = planetTexture(planet, lowPower ? 256 : 384);
        if (texture) textures.push(texture);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(bodySize, lowPower ? 16 : 24, lowPower ? 16 : 24),
          new THREE.MeshStandardMaterial({ map: texture, color: texture ? 0xffffff : planet.orbitColor, roughness: 0.8, emissive: planet.id === selectedId ? new THREE.Color(planet.orbitColor) : new THREE.Color(0x000000), emissiveIntensity: 0.14 }),
        );
        mesh.userData.planetId = planet.id;
        mesh.userData.planetColor = planet.orbitColor;
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(bodySize * 1.3, lowPower ? 12 : 18, lowPower ? 12 : 18),
          new THREE.MeshBasicMaterial({ color: planet.orbitColor, transparent: true, opacity: planet.id === selectedId ? .12 : .045, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        halo.userData.baseScale = 1; mesh.userData.visualHalo = halo; mesh.add(halo);
        if (planet.id === selectedId) mesh.scale.setScalar(1.24);
        scene.add(mesh);
        systemMeshesRef.current.set(planet.id, mesh);
        planetObjects.push({ data: planet, mesh, radius });
      });
      if (isDoublePlanetSystem && system.planets.length >= 2) {
        mutualOrbitGroup = new THREE.Group();
        const loop = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(Array.from({ length: lowPower ? 48 : 80 }, (_, index) => {
            const phase = index / (lowPower ? 48 : 80) * Math.PI * 2;
            return new THREE.Vector3(Math.cos(phase) * .34, 0, Math.sin(phase) * .34);
          })),
          new THREE.LineBasicMaterial({ color: 0x79e4c9, transparent: true, opacity: .52, blending: THREE.AdditiveBlending }),
        );
        mutualOrbitGroup.add(loop); scene.add(mutualOrbitGroup);
        const bridgeGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        doublePlanetBridge = new THREE.Line(bridgeGeometry, new THREE.LineBasicMaterial({ color: 0xb7fff0, transparent: true, opacity: .38, blending: THREE.AdditiveBlending }));
        scene.add(doublePlanetBridge);
      }
    }

    if (view === "star") {
      camera.position.set(0, 0.1, compact ? 7.2 : 6.1);
      controls.minDistance = 3.8;
      controls.maxDistance = 13;
      starGroup = isBlackHoleSystem ? createBlackHoleModel(scene, true, lowPower) : createStar(scene, system.temperatureK, true, isPulsarSystem ? .34 : isWhiteDwarfSystem ? .62 : isBlueGiantSystem ? 1.35 : isRedGiantSystem ? 1.28 : 1);
      if (isBlueGiantSystem) nebulaGroup = createNebulaShell(scene, true, lowPower);
      if (isPulsarSystem) pulsarFeatureGroup = createPulsarFeatures(scene, true, lowPower);
      if (isBlueGiantSystem || isPulsarSystem || isBlackHoleSystem) orbitalDust = createOrbitalDust(scene, isBlueGiantSystem ? 5.1 : isBlackHoleSystem ? 3.85 : 3.2, isBlackHoleSystem ? 0xff9c5b : 0x83caff, lowPower);
      if (binarySystem) {
        companionStarGroup = createStar(scene, isBlackHoleSystem ? 4650 : Math.max(3900, system.temperatureK - 1250), true, .76);
        createBinaryOrbitPath(scene, 1.32, lowPower);
        createBinaryOrbitPath(scene, 1.92, lowPower);
      }
      if (tripleSystem) {
        companionStarGroup = createStar(scene, Math.max(4100, system.temperatureK - 900), true, .78);
        tertiaryStarGroup = createStar(scene, Math.max(3900, system.temperatureK - 1550), true, .58);
        createFigureEightOrbitPath(scene, 3.05, lowPower);
      }
      const corona = new THREE.Mesh(
          new THREE.TorusGeometry(2.15, 0.018, 8, lowPower ? 72 : 112),
        new THREE.MeshBasicMaterial({ color: 0xffad43, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }),
      );
      corona.rotation.x = 0.75;
      scene.add(corona);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (event: MouseEvent) => {
      if (view !== "system") return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(planetObjects.map((item) => item.mesh), false)[0];
      const id = hit?.object.userData.planetId as string | undefined;
      if (id) setSelectedId(id);
    };
    renderer.domElement.addEventListener("click", onClick);

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(mount);

    let previousFrameAt = 0;
    const targetFrameMs = lowPower ? 1000 / 30 : 1000 / 50;
    const animate = (frameAt = 0) => {
      animationFrame = requestAnimationFrame(animate);
      if (document.hidden || frameAt - previousFrameAt < targetFrameMs) return;
      previousFrameAt = frameAt;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!pausedRef.current) simulationDays += delta * PREVIEW_DAYS_PER_SECOND * speedRef.current;
      stars.rotation.y += delta * 0.002;
      if (featured) featured.rotation.y += delta * 0.075 * Math.max(speedRef.current, 0.4);
      if (featuredAtmosphere) { featuredAtmosphere.rotation.y -= delta * .035; featuredAtmosphere.rotation.z += delta * .006; }
      if (starGroup) starGroup.rotation.y += delta * 0.035;
      if (companionStarGroup) companionStarGroup.rotation.y -= delta * 0.028;
      if (nebulaGroup) { nebulaGroup.rotation.y += delta * .011; nebulaGroup.rotation.z -= delta * .004; nebulaGroup.scale.setScalar(1 + Math.sin(frameAt * .00035) * .025); }
      if (pulsarFeatureGroup) { pulsarFeatureGroup.rotation.z += delta * 2.4; pulsarFeatureGroup.rotation.y = Math.sin(frameAt * .0012) * .12; }
      if (orbitalDust) { orbitalDust.rotation.y += delta * (isBlackHoleSystem ? .22 : .028); orbitalDust.rotation.z += delta * .004; }
      if (isBlackHoleSystem && starGroup) {
        const accretionDisc = starGroup.userData.accretionDisc as THREE.Group | undefined;
        const lens = starGroup.userData.lens as THREE.Mesh | undefined;
        const jets = starGroup.userData.jets as THREE.Group | undefined;
        if (accretionDisc) {
          accretionDisc.rotation.z += delta * .32;
          accretionDisc.children.forEach((child, index) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) child.material.opacity = Number(child.userData.baseOpacity ?? .4) * (.88 + Math.sin(frameAt * .0014 + index) * .12);
          });
        }
        if (lens) lens.rotation.y += delta * .13;
        if (jets) jets.scale.y = 1 + Math.sin(frameAt * .002) * .07;
      }
      if (tripleSystem && starGroup && companionStarGroup && tertiaryStarGroup) {
        const choreographyPhase = simulationDays / 18.6 * Math.PI * 2;
        const choreographyRadius = view === "star" ? 3.05 : 1.18;
        const placeOnFigureEight = (group: THREE.Group, phaseOffset: number) => { const phase = choreographyPhase + phaseOffset; group.position.set(Math.sin(phase) * choreographyRadius, 0, Math.sin(phase) * Math.cos(phase) * choreographyRadius * .58); };
        placeOnFigureEight(starGroup, 0);
        placeOnFigureEight(companionStarGroup, Math.PI * 2 / 3);
        placeOnFigureEight(tertiaryStarGroup, Math.PI * 4 / 3);
        tertiaryStarGroup.rotation.y += delta * .023;
      } else if (starGroup && companionStarGroup) {
        const pairAngle = simulationDays / 9.4 * Math.PI * 2;
        const primarySeparation = view === "star" ? 1.32 : .42;
        const companionSeparation = view === "star" ? 1.92 : .62;
        starGroup.position.set(Math.cos(pairAngle) * -primarySeparation, 0, Math.sin(pairAngle) * -primarySeparation * .38);
        companionStarGroup.position.set(Math.cos(pairAngle) * companionSeparation, 0, Math.sin(pairAngle) * companionSeparation * .38);
      }
      if (view === "system") {
        const epochDays = (Date.now() - new Date(system.epochAt).getTime()) / 86400000;
        let doubleBarycentre: THREE.Vector3 | undefined;
        planetObjects.forEach(({ data, mesh, radius }, index) => {
          const angle = (data.epochAngleDeg * Math.PI / 180) + ((epochDays + simulationDays) / data.periodDays) * Math.PI * 2;
          if (isDoublePlanetSystem && index < 2) {
            const reference = system.planets[0];
            const baryRadius = orbitRadius(reference.semiMajorAu);
            const baryAngle = (reference.epochAngleDeg * Math.PI / 180) + ((epochDays + simulationDays) / reference.periodDays) * Math.PI * 2;
            const mutualAngle = ((epochDays + simulationDays) / 6.4) * Math.PI * 2 + index * Math.PI;
            doubleBarycentre = new THREE.Vector3(Math.cos(baryAngle) * baryRadius, 0, Math.sin(baryAngle) * baryRadius);
            mesh.position.set(doubleBarycentre.x + Math.cos(mutualAngle) * .34, 0, doubleBarycentre.z + Math.sin(mutualAngle) * .34);
          } else mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
          mesh.rotation.y += delta * 0.23;
          const visualHalo = mesh.userData.visualHalo as THREE.Mesh | undefined;
          if (visualHalo) visualHalo.scale.setScalar(1 + Math.sin(frameAt * .002 + index) * .08);
        });
        if (mutualOrbitGroup && doubleBarycentre) { mutualOrbitGroup.position.copy(doubleBarycentre); mutualOrbitGroup.rotation.y += delta * .12; }
        if (doublePlanetBridge && planetObjects.length >= 2) {
          const positionAttribute = doublePlanetBridge.geometry.getAttribute("position") as THREE.BufferAttribute;
          positionAttribute.setXYZ(0, planetObjects[0].mesh.position.x, planetObjects[0].mesh.position.y, planetObjects[0].mesh.position.z);
          positionAttribute.setXYZ(1, planetObjects[1].mesh.position.x, planetObjects[1].mesh.position.y, planetObjects[1].mesh.position.z);
          positionAttribute.needsUpdate = true;
        }
      }
      controls.update();
      renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; queueMicrotask(() => setModelReady(true)); }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      textures.forEach((texture) => texture.dispose());
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      systemMeshesRef.current.clear();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [showHabitable, system, view]);

  if (!selected) return null;
  const ownerName = ownerLabel ?? selected.displayName;

  return (
    <section className="celestial-explorer" role="dialog" aria-modal="true" aria-label={`${system.designation} 3D celestial explorer`}>
      <div ref={mountRef} className="explorer-webgl" />
      {!modelReady && !webglError && <div className="explorer-model-loading"><span>N</span><b>INITIALISING VERIFIED 3D MODEL…</b></div>}
      {webglError && <div className="explorer-error"><b>WebGL 3D is unavailable on this device</b><span>Close this view to continue with the live orbital simulation.</span></div>}
      <header className="explorer-header">
        <a className="explorer-brand" href="#top" onClick={(event) => { event.preventDefault(); onClose(); }}><span>N</span><b>NOCTUA</b></a>
        <nav aria-label="3D viewing mode">
          {(["planet", "system", "star"] as ViewMode[]).map((mode) => <button key={mode} className={view === mode ? "active" : ""} onClick={() => setView(mode)}>{mode === "planet" ? "PLANET" : mode === "system" ? "SYSTEM" : "STAR"}</button>)}
        </nav>
        <button className="explorer-close" onClick={onClose} aria-label="Close the 3D explorer">CLOSE ×</button>
      </header>

      <aside className="explorer-info">
        <p>{ownerLabel ? "PRIVATE REGISTERED SYSTEM" : "MODEL CANDIDATE / INTERACTIVE 3D"}</p>
        {ownerLabel && <span className="explorer-owner">HOLDER’S PRIVATE NAME · {ownerLabel}</span>}
        <h1>{view === "planet" ? (ownerName ?? selected.code) : (system.displayName ?? system.designation)}</h1>
        <div className="explorer-subtitle"><span>{view === "planet" ? selected.type : system.classification}</span><i /> <span>{system.distancePc.toFixed(1)} pc</span></div>
        <code className="explorer-model-code">{view === "planet" ? `${system.id} / ${system.designation} / ${selected.id} / ${selected.code}` : `${system.id} / ${system.designation}`}</code>
        {isBinarySystem && view !== "planet" && <span className="explorer-binary-note">MUTUAL BARYCENTRIC ORBIT · 9.4-DAY STELLAR PERIOD</span>}
        {isTripleSystem && view !== "planet" && <span className="explorer-binary-note triple">THREE-BODY FIGURE-EIGHT CHOREOGRAPHY · SCHEMATIC MODEL</span>}
        {isWhiteDwarfSystem && view !== "planet" && <span className="explorer-stellar-note white-dwarf">WHITE DWARF · HOT COMPACT STELLAR REMNANT</span>}
        {isRedGiantSystem && view !== "planet" && <span className="explorer-stellar-note red-giant">RED GIANT · EXPANDED EVOLVED STAR</span>}
        {isBlueGiantSystem && view !== "planet" && <span className="explorer-stellar-note blue-giant">BLUE SUPERGIANT · IONISED WIND NEBULA</span>}
        {isPulsarSystem && view !== "planet" && <span className="explorer-stellar-note pulsar">PULSAR · ROTATING LIGHTHOUSE BEAMS</span>}
        {isBlackHoleSystem && view !== "planet" && <span className="explorer-stellar-note black-hole">BLACK HOLE BINARY · ACCRETION DISC MODEL</span>}
        {isDoublePlanetSystem && view === "system" && <span className="explorer-stellar-note double-planet">DOUBLE PLANET · 6.4-DAY MUTUAL ORBIT</span>}
        {view === "planet" ? <>
          <div className="explorer-metrics"><div><small>MASS</small><b>{selected.massEarth.toFixed(2)} M⊕</b></div><div><small>RADIUS</small><b>{selected.radiusEarth.toFixed(2)} R⊕</b></div><div><small>TEMPERATURE</small><b>{selected.equilibriumTemp} K</b></div><div><small>ASTROBIOLOGY</small><b>{selected.bioScore}%</b></div></div>
          <p className="explorer-description">{selected.atmosphere} · {selected.state}. {selected.bioPrediction}</p>
          <p className="explorer-life-speculation"><b>SPECULATIVE LIFE MORPHOLOGY</b>{selected.lifeSpeculation ?? "No complex morphology is favoured by the current model. Any creature analogy is imaginative visualisation, not observational evidence."}</p>
        </> : <p className="explorer-description">{view === "system" ? `Live approximate positions for ${system.planets.length} candidate planets, calculated from their reference epoch and orbital periods.` : `Surface temperature approximately ${system.temperatureK.toLocaleString()} K, with ${system.luminosity.toFixed(2)} times the Sun’s luminosity.`}</p>}
        {registryCode && <code className="explorer-registry">PRIVATE SYSTEM REGISTRY {registryCode}</code>}
      </aside>

      {view === "system" && <div className="explorer-planet-list" aria-label="Select a candidate planet">{system.planets.map((planet) => <button key={planet.id} className={selected.id === planet.id ? "active" : ""} onClick={() => setSelectedId(planet.id)}><i style={{ background: planet.orbitColor }} /><span><b>{planet.displayName ?? planet.code}</b><small>{planet.id}</small></span></button>)}</div>}

      <div className="explorer-controls">
        <div><span>DRAG TO ROTATE</span><span>SCROLL / PINCH TO ZOOM</span><span>{view === "system" ? "SELECT A PLANET" : "FREE OBSERVATION"}</span></div>
        {view === "system" && <div className="explorer-time"><button className={showHabitable ? "active" : ""} onClick={() => setShowHabitable((value) => !value)}>HABITABLE ZONE</button>{[0.2, 1, 10, 50].map((value) => <button key={value} className={speed === value ? "active" : ""} onClick={() => { setSpeed(value); setPaused(false); }}>{value}×</button>)}<button className={paused ? "active" : ""} onClick={() => setPaused((value) => !value)}>{paused ? "RESUME" : "PAUSE"}</button></div>}
      </div>
      <div className="explorer-vignette" aria-hidden="true" />
    </section>
  );
}
