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

function OrbitCanvas({ system, selectedId, onSelect, mode, ownerLabel }: { system: StarSystem; selectedId: string; onSelect: (id: string) => void; mode: "live" | "animation"; ownerLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<{ id: string; x: number; y: number; radius: number }[]>([]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width; const h = rect.height; const cx = w * .49; const cy = h * .5;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .72);
      gradient.addColorStop(0, "#102536"); gradient.addColorStop(.45, "#08141f"); gradient.addColorStop(1, "#03080e");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(135,174,194,.1)"; ctx.lineWidth = 1;
      const grid = 48;
      for (let x = cx % grid; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = cy % grid; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const maxOrbit = Math.min(w * .42, h * .43); const maxAu = Math.max(...system.planets.map((planet) => planet.semiMajorAu), 1);
      positionsRef.current = [];
      ctx.setLineDash([3, 6]);
      system.planets.forEach((planet) => {
        const orbit = 48 + Math.sqrt(planet.semiMajorAu / maxAu) * (maxOrbit - 48);
        ctx.strokeStyle = planet.id === selectedId ? `${planet.orbitColor}aa` : "rgba(132,164,181,.2)";
        ctx.lineWidth = planet.id === selectedId ? 1.6 : .8; ctx.beginPath(); ctx.ellipse(cx, cy, orbit, orbit * .56, -.18, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.shadowColor = "#ffd37a"; ctx.shadowBlur = 32; ctx.fillStyle = "#fff1b2"; ctx.beginPath(); ctx.arc(cx, cy, 9 + system.starRadius * 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      const elapsedDays = (Date.now() - new Date(system.epochAt).getTime()) / 86400000;
      system.planets.forEach((planet, index) => {
        const orbit = 48 + Math.sqrt(planet.semiMajorAu / maxAu) * (maxOrbit - 48);
        const degrees = mode === "live" ? planet.epochAngleDeg + elapsedDays / planet.periodDays * 360 : planet.epochAngleDeg + time * (.006 / Math.sqrt(planet.periodDays));
        const angle = degrees * Math.PI / 180;
        const x = cx + Math.cos(angle) * orbit * Math.cos(.18) - Math.sin(angle) * orbit * .56 * Math.sin(-.18);
        const y = cy + Math.cos(angle) * orbit * Math.sin(-.18) + Math.sin(angle) * orbit * .56 * Math.cos(.18);
        const radius = Math.max(4, Math.min(10, 3 + Math.log2(planet.radiusEarth + 1) * 2));
        positionsRef.current.push({ id: planet.id, x, y, radius: radius + 7 });
        ctx.fillStyle = planet.orbitColor; ctx.shadowColor = planet.orbitColor; ctx.shadowBlur = planet.id === selectedId ? 19 : 7;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        if (planet.id === selectedId) { ctx.strokeStyle = "rgba(255,255,255,.68)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, radius + 7 + Math.sin(time / 250) * 2, 0, Math.PI * 2); ctx.stroke(); }
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
    canvas.addEventListener("click", click);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); canvas.removeEventListener("click", click); };
  }, [system, selectedId, mode, ownerLabel]);

  return <canvas ref={canvasRef} className="orbit-canvas" aria-label={`${system.designation} 即時行星軌道圖；點擊行星可查看詳情`} />;
}

export default function Home() {
  const [systems, setSystems] = useState<StarSystem[]>(fallbackSystems);
  const [packages, setPackages] = useState<NamingPackage[]>(fallbackPackages);
  const [systemId, setSystemId] = useState(fallbackSystems[0].id);
  const [planetId, setPlanetId] = useState(fallbackSystems[0].planets[2].id);
  const [mode, setMode] = useState<"live" | "animation">("live");
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
        <nav><a href="#observatory">即時星系</a><a href="#discoveries">最新發布</a><a href="#registry">紀念命名</a><button onClick={() => setRegistryOpen(true)}>持有者入口</button></nav>
        <a className="admin-link" href="/admin">後台管理 ↗</a>
      </header>
      <div className="science-banner"><b>MODEL CANDIDATE</b> 所有天體皆為訊號推演候選體，尚非正式天文發現；位置依軌道週期與參考曆元即時計算。</div>

      <section className="observatory" id="observatory">
        <div className="observatory-head" id="top">
          <div><p className="eyebrow">LIVE SYSTEM / {system.id}</p><h1>{system.displayName ?? system.designation}</h1><p>{system.summary}</p></div>
          <div className="system-coordinates"><span>RA <b>{formatRa(system.raHours)}</b></span><span>DEC <b>{formatDec(system.decDeg)}</b></span><span>DIST <b>{system.distancePc.toFixed(1)} pc</b></span></div>
        </div>
        <div className="observatory-grid">
          <article className="system-viewport">
            <div className="viewport-toolbar"><div><i /> LIVE POSITION <span>{system.planets.length} PLANETS</span></div><div className="mode-switch"><button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>即時位置</button><button className={mode === "animation" ? "active" : ""} onClick={() => setMode("animation")}>動畫預覽</button></div></div>
            <OrbitCanvas system={system} selectedId={planet.id} onSelect={setPlanetId} mode={mode} />
            <div className="viewport-foot"><span>視野：約 {Math.max(...system.planets.map((item) => item.semiMajorAu)).toFixed(2)} AU</span><span>點擊軌道上的行星查看資料</span></div>
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
