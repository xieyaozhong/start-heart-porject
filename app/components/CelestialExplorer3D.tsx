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

function createStar(scene: THREE.Scene, temperatureK: number, large = false) {
  const warm = temperatureK < 5200;
  const color = warm ? 0xffa83d : temperatureK > 6800 ? 0x9fc9ff : 0xffd180;
  const group = new THREE.Group();
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(large ? 1.55 : 0.42, large ? 48 : 32, large ? 48 : 32),
    new THREE.MeshBasicMaterial({ color }),
  );
  group.add(star);
  for (let layer = 1; layer <= 3; layer += 1) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry((large ? 1.55 : 0.42) * (1 + layer * 0.12), 28, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 / layer, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
    );
    group.add(glow);
  }
  const light = new THREE.PointLight(color, large ? 75 : 42, large ? 55 : 32, 1.2);
  group.add(light);
  scene.add(group);
  return group;
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
    const binarySystem = system.id === "SYS-NX-BIN-021" || /binary/i.test(system.classification);
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
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.69, lowPower ? 32 : 48, lowPower ? 32 : 48),
        new THREE.MeshBasicMaterial({ color: colorWithLightness(selected.orbitColor, 0.24), transparent: true, opacity: 0.11, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
      );
      scene.add(atmosphere);
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
      starGroup = createStar(scene, system.temperatureK);
      if (binarySystem) companionStarGroup = createStar(scene, Math.max(3900, system.temperatureK - 1250));
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
        if (planet.id === selectedId) mesh.scale.setScalar(1.24);
        scene.add(mesh);
        systemMeshesRef.current.set(planet.id, mesh);
        planetObjects.push({ data: planet, mesh, radius });
      });
    }

    if (view === "star") {
      camera.position.set(0, 0.1, compact ? 7.2 : 6.1);
      controls.minDistance = 3.8;
      controls.maxDistance = 13;
      starGroup = createStar(scene, system.temperatureK, true);
      if (binarySystem) companionStarGroup = createStar(scene, Math.max(3900, system.temperatureK - 1250), true);
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
      if (starGroup) starGroup.rotation.y += delta * 0.035;
      if (companionStarGroup) companionStarGroup.rotation.y -= delta * 0.028;
      if (starGroup && companionStarGroup) {
        const pairAngle = simulationDays / 9.4 * Math.PI * 2;
        const pairSeparation = view === "star" ? 1.72 : .54;
        starGroup.position.set(Math.cos(pairAngle) * -pairSeparation, Math.sin(pairAngle) * -.12, Math.sin(pairAngle) * -pairSeparation * .38);
        companionStarGroup.position.set(Math.cos(pairAngle) * pairSeparation, Math.sin(pairAngle) * .12, Math.sin(pairAngle) * pairSeparation * .38);
      }
      if (view === "system") {
        const epochDays = (Date.now() - new Date(system.epochAt).getTime()) / 86400000;
        planetObjects.forEach(({ data, mesh, radius }) => {
          const angle = (data.epochAngleDeg * Math.PI / 180) + ((epochDays + simulationDays) / data.periodDays) * Math.PI * 2;
          mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
          mesh.rotation.y += delta * 0.23;
        });
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
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
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
