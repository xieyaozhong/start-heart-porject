"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Inputs = {
  signalMethod: string;
  raHours: number;
  decDeg: number;
  distancePc: number;
  starMass: number;
  starRadius: number;
  radialVelocity: number;
  orbitalPeriod: number;
  eccentricity: number;
  transitDepth: number;
  phase: number;
  positionAngle: number;
};

type Candidate = {
  id: string;
  createdAt: string;
  raHours: number;
  decDeg: number;
  predictedRa: number;
  predictedDec: number;
  distancePc: number;
  periodDays: number;
  minimumMassJupiter: number;
  radiusEarth: number;
  semiMajorAu: number;
  angularSeparationMas: number;
  equilibriumTemp: number;
  type: string;
  confidence: number;
  probabilities: { label: string; value: number }[];
};

const defaults: Inputs = {
  signalMethod: "徑向速度",
  raHours: 19.8464,
  decDeg: 8.8683,
  distancePc: 47.2,
  starMass: 0.91,
  starRadius: 0.94,
  radialVelocity: 23.8,
  orbitalPeriod: 126.4,
  eccentricity: 0.12,
  transitDepth: 780,
  phase: 42,
  positionAngle: 118,
};

const demoCandidates: Candidate[] = [
  {
    id: "NX-2407-C",
    createdAt: "2026-07-18T09:12:00.000Z",
    raHours: 19.8464,
    decDeg: 8.8683,
    predictedRa: 19.846402,
    predictedDec: 8.868296,
    distancePc: 47.2,
    periodDays: 126.4,
    minimumMassJupiter: 0.54,
    radiusEarth: 3.03,
    semiMajorAu: 0.48,
    angularSeparationMas: 10.17,
    equilibriumTemp: 356,
    type: "溫暖海王星型",
    confidence: 82,
    probabilities: [
      { label: "海王星型", value: 58 },
      { label: "氣態巨行星", value: 27 },
      { label: "超級地球", value: 15 },
    ],
  },
  {
    id: "NX-2391-A",
    createdAt: "2026-07-15T04:26:00.000Z",
    raHours: 5.2351,
    decDeg: -8.201,
    predictedRa: 5.235098,
    predictedDec: -8.200996,
    distancePc: 83.7,
    periodDays: 18.6,
    minimumMassJupiter: 0.029,
    radiusEarth: 1.86,
    semiMajorAu: 0.13,
    angularSeparationMas: 1.55,
    equilibriumTemp: 721,
    type: "高溫超級地球",
    confidence: 74,
    probabilities: [
      { label: "超級地球", value: 69 },
      { label: "迷你海王星", value: 22 },
      { label: "岩質行星", value: 9 },
    ],
  },
];

const knownStars = [
  [0.62, 0.18, 1.7], [0.22, 0.34, 1.1], [0.8, 0.39, 2.2], [0.47, 0.55, 1.4],
  [0.14, 0.66, 1.8], [0.69, 0.72, 1.2], [0.91, 0.13, 1.3], [0.34, 0.82, 2],
  [0.53, 0.27, 0.9], [0.73, 0.53, 0.8], [0.08, 0.43, 1], [0.86, 0.8, 1.5],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function classify(massJ: number, radiusE: number, tempK: number) {
  const hot = tempK > 600 ? "高溫" : tempK < 220 ? "冰冷" : tempK < 420 ? "溫暖" : "暖熱";
  let base = "未知行星";
  let probabilities = [
    { label: "超級地球", value: 34 },
    { label: "海王星型", value: 33 },
    { label: "氣態巨行星", value: 33 },
  ];

  if (massJ >= 13) {
    base = "棕矮星候選體";
    probabilities = [
      { label: "棕矮星", value: 83 },
      { label: "低質量恆星", value: 11 },
      { label: "超級木星", value: 6 },
    ];
  } else if (massJ >= 0.3 || radiusE > 7) {
    base = `${hot}氣態巨行星`;
    probabilities = [
      { label: "氣態巨行星", value: 72 },
      { label: "海王星型", value: 19 },
      { label: "棕矮星", value: 9 },
    ];
  } else if (massJ >= 0.045 || radiusE > 2.5) {
    base = `${hot}海王星型`;
    probabilities = [
      { label: "海王星型", value: 61 },
      { label: "迷你海王星", value: 27 },
      { label: "氣態巨行星", value: 12 },
    ];
  } else if (radiusE > 1.35 || massJ > 0.008) {
    base = `${hot}超級地球`;
    probabilities = [
      { label: "超級地球", value: 68 },
      { label: "迷你海王星", value: 23 },
      { label: "岩質行星", value: 9 },
    ];
  } else {
    base = `${hot}岩質行星`;
    probabilities = [
      { label: "岩質行星", value: 75 },
      { label: "超級地球", value: 18 },
      { label: "其他", value: 7 },
    ];
  }

  return { base, probabilities };
}

function calculate(inputs: Inputs): Candidate {
  const G = 6.6743e-11;
  const solarMass = 1.98847e30;
  const jupiterMass = 1.89813e27;
  const periodSeconds = inputs.orbitalPeriod * 86400;
  const massKg =
    inputs.radialVelocity *
    Math.sqrt(1 - inputs.eccentricity ** 2) *
    Math.pow(periodSeconds / (2 * Math.PI * G), 1 / 3) *
    Math.pow(inputs.starMass * solarMass, 2 / 3);
  const minimumMassJupiter = Math.max(0.0003, massKg / jupiterMass);
  const periodYears = inputs.orbitalPeriod / 365.25;
  const semiMajorAu = Math.cbrt(inputs.starMass * periodYears ** 2);
  const radiusEarth = Math.max(
    0.2,
    Math.sqrt(Math.max(0, inputs.transitDepth) * 1e-6) * inputs.starRadius * 109.1,
  );
  const luminosity = Math.pow(inputs.starMass, 3.5);
  const equilibriumTemp = 278 * Math.pow(luminosity, 0.25) / Math.sqrt(2 * semiMajorAu);
  const angularSeparationMas = (semiMajorAu / inputs.distancePc) * 1000;
  const projectedMas = angularSeparationMas * Math.cos((inputs.phase * Math.PI) / 180);
  const offsetDeg = projectedMas / 3_600_000;
  const pa = (inputs.positionAngle * Math.PI) / 180;
  const predictedDec = inputs.decDeg + offsetDeg * Math.sin(pa);
  const predictedRa =
    inputs.raHours +
    (offsetDeg * Math.cos(pa)) /
      (15 * Math.max(0.2, Math.cos((inputs.decDeg * Math.PI) / 180)));
  const { base, probabilities } = classify(minimumMassJupiter, radiusEarth, equilibriumTemp);
  const methodBonus = inputs.signalMethod === "聯合擬合" ? 12 : inputs.signalMethod === "凌日" ? 7 : 4;
  const confidence = Math.round(clamp(48 + methodBonus + Math.log10(inputs.radialVelocity + 1) * 10 + (inputs.transitDepth > 0 ? 8 : 0), 42, 94));

  return {
    id: `NX-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    raHours: inputs.raHours,
    decDeg: inputs.decDeg,
    predictedRa,
    predictedDec,
    distancePc: inputs.distancePc,
    periodDays: inputs.orbitalPeriod,
    minimumMassJupiter,
    radiusEarth,
    semiMajorAu,
    angularSeparationMas,
    equilibriumTemp,
    type: base,
    confidence,
    probabilities,
  };
}

function formatRa(hours: number) {
  const normalized = ((hours % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const mFloat = (normalized - h) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${s.toFixed(2)}s`;
}

function formatDec(degrees: number) {
  const sign = degrees >= 0 ? "+" : "−";
  const absolute = Math.abs(degrees);
  const d = Math.floor(absolute);
  const mFloat = (absolute - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}′ ${s.toFixed(1)}″`;
}

function SkyMap({ candidate, zoom }: { candidate: Candidate; zoom: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const w = rect.width;
    const h = rect.height;

    const bg = ctx.createRadialGradient(w * 0.48, h * 0.48, 10, w * 0.48, h * 0.48, w * 0.7);
    bg.addColorStop(0, "#102638");
    bg.addColorStop(0.55, "#081521");
    bg.addColorStop(1, "#040a11");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(143, 174, 194, .14)";
    ctx.lineWidth = 1;
    const grid = 44 * zoom;
    for (let x = w / 2 % grid; x < w; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = h / 2 % grid; y < h; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.fillStyle = "rgba(215, 235, 244, .82)";
    knownStars.forEach(([px, py, r], i) => {
      const x = ((px - 0.5) * zoom + 0.5) * w;
      const y = ((py - 0.5) * zoom + 0.5) * h;
      if (x < 0 || x > w || y < 0 || y > h) return;
      ctx.globalAlpha = 0.58 + (i % 3) * 0.16;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    const cx = w * 0.52;
    const cy = h * 0.49;
    ctx.strokeStyle = "rgba(255, 176, 74, .35)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62 * zoom, 24 * zoom, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f5f0d8";
    ctx.shadowColor = "#cceeff";
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

    const angle = (candidate.periodDays + candidate.raHours * 12) % 360 * Math.PI / 180;
    const px = cx + Math.cos(angle) * 62 * zoom;
    const py = cy + Math.sin(angle) * 24 * zoom;
    ctx.fillStyle = "#ffb24b";
    ctx.shadowColor = "#ff9b37";
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 178, 75, .75)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 8, py - 8); ctx.lineTo(px + 48, py - 42); ctx.stroke();
    ctx.fillStyle = "#ffca7d";
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.fillText(candidate.id, px + 52, py - 42);
    ctx.fillStyle = "rgba(210, 230, 240, .66)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(formatRa(candidate.predictedRa), px + 52, py - 26);

    ctx.fillStyle = "rgba(174, 205, 222, .48)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("N", 18, 24);
    ctx.fillText("E", w - 25, h - 18);
  }, [candidate, zoom]);

  return <canvas className="sky-canvas" ref={canvasRef} aria-label={`候選天體 ${candidate.id} 的預測星圖`} />;
}

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(defaults);
  const [candidates, setCandidates] = useState<Candidate[]>(demoCandidates);
  const [selectedId, setSelectedId] = useState(demoCandidates[0].id);
  const [calculating, setCalculating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<"lab" | "records" | "naming">("lab");
  const [checkout, setCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);
  const [packageName, setPackageName] = useState("探索者");
  const [desiredName, setDesiredName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/candidates")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.candidates) && data.candidates.length) {
          const hydrated = data.candidates.map((item: Candidate & { probabilitiesJson?: string }) => ({
            ...item,
            probabilities: item.probabilities ?? JSON.parse(item.probabilitiesJson || "[]"),
          }));
          setCandidates(hydrated);
          setSelectedId(hydrated[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0],
    [candidates, selectedId],
  );

  function updateNumber(key: keyof Inputs, value: string) {
    setInputs((current) => ({ ...current, [key]: Number(value) }));
  }

  function runCalculation(event: FormEvent) {
    event.preventDefault();
    setCalculating(true);
    window.setTimeout(() => {
      const result = calculate(inputs);
      setCandidates((current) => [result, ...current]);
      setSelectedId(result.id);
      setCalculating(false);
      fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result),
      }).catch(() => undefined);
    }, 850);
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    const orderId = `ORD-${Date.now().toString().slice(-7)}`;
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          candidateId: selected.id,
          desiredName,
          email,
          packageName,
        }),
      });
    } catch {}
    setOrderDone(orderId);
  }

  const packagePrice = packageName === "典藏者" ? 2680 : packageName === "觀測者" ? 1280 : 680;

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setPanel("lab")} aria-label="返回觀測台首頁">
          <span className="brand-mark">N</span>
          <span><b>NOCTUA</b><small>暗夜天體觀測台</small></span>
        </button>
        <nav aria-label="主要導覽">
          <button className={panel === "lab" ? "active" : ""} onClick={() => setPanel("lab")}>推演實驗室</button>
          <button className={panel === "records" ? "active" : ""} onClick={() => setPanel("records")}>候選紀錄</button>
          <button className={panel === "naming" ? "active" : ""} onClick={() => setPanel("naming")}>紀念命名</button>
        </nav>
        <div className="observatory-status"><i /> 系統在線 <span>UTC+8</span></div>
      </header>

      <div className="science-notice">
        <span>SIMULATION / 科學推演</span>
        本站結果是依輸入訊號產生的候選模型，不等同正式發現；紀念命名不是 IAU 官方命名。
      </div>

      {panel === "lab" && (
        <>
          <section className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">INFERENCE ENGINE · v2.4</p>
              <h1>從看不見的擾動，<br /><em>推回一顆星。</em></h1>
              <p className="lede">輸入徑向速度、凌日深度與母恆星參數，估算未被直接觀測天體的質量、軌道、類型及下一個可能位置。</p>
              <div className="hero-stats">
                <div><b>{candidates.length.toString().padStart(2, "0")}</b><span>候選紀錄</span></div>
                <div><b>9</b><span>輸入維度</span></div>
                <div><b>3</b><span>分類模型</span></div>
              </div>
            </div>

            <form className="input-console" onSubmit={runCalculation}>
              <div className="section-heading">
                <div><span>01</span><h2>觀測訊號</h2></div>
                <small>所有欄位可調整</small>
              </div>
              <div className="method-switch" role="group" aria-label="觀測方法">
                {["徑向速度", "凌日", "聯合擬合"].map((method) => (
                  <button type="button" key={method} className={inputs.signalMethod === method ? "selected" : ""} onClick={() => setInputs({ ...inputs, signalMethod: method })}>{method}</button>
                ))}
              </div>
              <div className="field-grid">
                <label>母恆星赤經 <span>hr</span><input type="number" step="0.0001" value={inputs.raHours} onChange={(e) => updateNumber("raHours", e.target.value)} /></label>
                <label>母恆星赤緯 <span>deg</span><input type="number" step="0.0001" value={inputs.decDeg} onChange={(e) => updateNumber("decDeg", e.target.value)} /></label>
                <label>距離 <span>pc</span><input type="number" min="0.1" step="0.1" value={inputs.distancePc} onChange={(e) => updateNumber("distancePc", e.target.value)} /></label>
                <label>恆星質量 <span>M☉</span><input type="number" min="0.08" step="0.01" value={inputs.starMass} onChange={(e) => updateNumber("starMass", e.target.value)} /></label>
                <label>徑向速度振幅 <span>m/s</span><input type="number" min="0" step="0.1" value={inputs.radialVelocity} onChange={(e) => updateNumber("radialVelocity", e.target.value)} /></label>
                <label>軌道週期 <span>day</span><input type="number" min="0.1" step="0.1" value={inputs.orbitalPeriod} onChange={(e) => updateNumber("orbitalPeriod", e.target.value)} /></label>
                <label>軌道偏心率 <span>e</span><input type="number" min="0" max="0.95" step="0.01" value={inputs.eccentricity} onChange={(e) => updateNumber("eccentricity", e.target.value)} /></label>
                <label>凌日深度 <span>ppm</span><input type="number" min="0" step="10" value={inputs.transitDepth} onChange={(e) => updateNumber("transitDepth", e.target.value)} /></label>
              </div>
              <details>
                <summary>位置推演進階參數</summary>
                <div className="field-grid compact">
                  <label>母恆星半徑 <span>R☉</span><input type="number" min="0.1" step="0.01" value={inputs.starRadius} onChange={(e) => updateNumber("starRadius", e.target.value)} /></label>
                  <label>軌道相位 <span>deg</span><input type="number" min="0" max="360" value={inputs.phase} onChange={(e) => updateNumber("phase", e.target.value)} /></label>
                  <label>位置角 <span>deg</span><input type="number" min="0" max="360" value={inputs.positionAngle} onChange={(e) => updateNumber("positionAngle", e.target.value)} /></label>
                </div>
              </details>
              <button className="calculate-button" type="submit" disabled={calculating}>
                <span>{calculating ? "正在求解軌道…" : "執行天體推演"}</span><b>→</b>
              </button>
            </form>
          </section>

          <section className="result-section">
            <div className="section-heading large">
              <div><span>02</span><h2>最新候選解</h2></div>
              <div className="solution-badge"><i /> SOLUTION CONVERGED</div>
            </div>
            <div className="result-grid">
              <article className="candidate-card">
                <div className="candidate-topline"><span>{selected.id}</span><small>MODEL CONFIDENCE</small></div>
                <div className="candidate-core">
                  <div className="planet-orb" aria-hidden="true"><i /></div>
                  <div>
                    <p>最可能類型</p>
                    <h3>{selected.type}</h3>
                    <div className="confidence"><span style={{ width: `${selected.confidence}%` }} /><b>{selected.confidence}%</b></div>
                  </div>
                </div>
                <div className="probability-list">
                  {selected.probabilities.map((probability) => (
                    <div key={probability.label}><span>{probability.label}</span><i><b style={{ width: `${probability.value}%` }} /></i><strong>{probability.value}%</strong></div>
                  ))}
                </div>
              </article>

              <article className="metric-panel">
                <div className="metric"><span>最低質量</span><b>{selected.minimumMassJupiter.toFixed(3)}</b><small>M♃</small></div>
                <div className="metric"><span>估計半徑</span><b>{selected.radiusEarth.toFixed(2)}</b><small>R⊕</small></div>
                <div className="metric"><span>半長軸</span><b>{selected.semiMajorAu.toFixed(3)}</b><small>AU</small></div>
                <div className="metric"><span>平衡溫度</span><b>{Math.round(selected.equilibriumTemp)}</b><small>K</small></div>
                <div className="position-box">
                  <p>預測天球座標 <span>± {Math.max(0.8, 10 - selected.confidence / 10).toFixed(1)} mas</span></p>
                  <b>{formatRa(selected.predictedRa)}</b>
                  <b>{formatDec(selected.predictedDec)}</b>
                </div>
              </article>

              <article className="map-panel">
                <div className="map-head"><div><span>預測星圖</span><small>視場中心：{selected.id}</small></div><div className="zoom"><button onClick={() => setZoom((z) => clamp(z - 0.2, 0.7, 1.8))} aria-label="縮小星圖">−</button><span>{zoom.toFixed(1)}×</span><button onClick={() => setZoom((z) => clamp(z + 0.2, 0.7, 1.8))} aria-label="放大星圖">＋</button></div></div>
                <SkyMap candidate={selected} zoom={zoom} />
                <div className="map-legend"><span><i className="host" />母恆星</span><span><i className="candidate" />候選天體</span><span>視角分離 {selected.angularSeparationMas.toFixed(2)} mas</span></div>
              </article>
            </div>
          </section>
        </>
      )}

      {panel === "records" && (
        <section className="page-section records-page">
          <div className="page-title"><p className="eyebrow">ARCHIVE / PERSISTENT RECORDS</p><h1>候選天體紀錄庫</h1><p>每次推演都保存輸入與模型輸出，方便後續比對觀測資料。</p></div>
          <div className="record-toolbar"><span>{candidates.length} 筆候選</span><button onClick={() => setPanel("lab")}>＋ 新增推演</button></div>
          <div className="record-table" role="table" aria-label="候選天體紀錄">
            <div className="record-row header" role="row"><span>候選編號</span><span>推測類型</span><span>位置（RA / DEC）</span><span>軌道週期</span><span>信心</span><span /></div>
            {candidates.map((candidate) => (
              <button className="record-row" role="row" key={candidate.id} onClick={() => { setSelectedId(candidate.id); setPanel("lab"); }}>
                <span><b>{candidate.id}</b><small>{new Date(candidate.createdAt).toLocaleDateString("zh-TW")}</small></span>
                <span>{candidate.type}</span>
                <span className="mono">{formatRa(candidate.predictedRa)}<small>{formatDec(candidate.predictedDec)}</small></span>
                <span>{candidate.periodDays.toFixed(1)} 日</span>
                <span><i className="mini-confidence"><b style={{ width: `${candidate.confidence}%` }} /></i>{candidate.confidence}%</span>
                <span>查看 →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {panel === "naming" && (
        <section className="page-section naming-page">
          <div className="naming-intro">
            <p className="eyebrow">PERSONAL COMMEMORATION</p>
            <h1>讓一個夜空座標，<br /><em>記得一個名字。</em></h1>
            <p>選擇候選天體，建立私人典藏用紀念名稱、數位證書與專屬星圖。這是一項文化紀念服務，不會改變天體的科學編號或 IAU 官方名稱。</p>
            <div className="selected-target"><span>目前選擇</span><b>{selected.id}</b><small>{selected.type} · {formatRa(selected.predictedRa)}</small></div>
          </div>
          <div className="package-grid">
            {[
              { name: "探索者", price: 680, note: "數位命名證書", detail: "HD 星圖 · 候選資料卡" },
              { name: "觀測者", price: 1280, note: "典藏版數位證書", detail: "4K 星圖 · 軌道推演報告", featured: true },
              { name: "典藏者", price: 2680, note: "完整紀念檔案", detail: "可列印證書 · 年度位置更新" },
            ].map((item) => (
              <article className={item.featured ? "package featured" : "package"} key={item.name}>
                {item.featured && <span className="popular">最多人選</span>}
                <p>{item.name}</p><h3>NT$ {item.price.toLocaleString()}</h3><b>{item.note}</b><small>{item.detail}</small>
                <button onClick={() => { setPackageName(item.name); setCheckout(true); setOrderDone(null); }}>選擇方案 →</button>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer><div><span className="brand-mark small">N</span><b>NOCTUA 暗夜天體觀測台</b></div><p>模型輸出僅供教育、研究假設與紀念用途。© 2026</p></footer>

      {checkout && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCheckout(false)}>
          <section className="checkout" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCheckout(false)} aria-label="關閉">×</button>
            {!orderDone ? (
              <form onSubmit={placeOrder}>
                <p className="eyebrow">MEMORIAL REGISTRY</p>
                <h2 id="checkout-title">建立紀念命名</h2>
                <div className="order-summary"><span>{packageName}方案 · {selected.id}</span><b>NT$ {packagePrice.toLocaleString()}</b></div>
                <label>想記錄的名稱<input required maxLength={40} value={desiredName} onChange={(e) => setDesiredName(e.target.value)} placeholder="例如：Asteria" /></label>
                <label>收件電子郵件<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></label>
                <label className="consent"><input required type="checkbox" />我了解此服務為私人紀念證書，不是官方天體命名權。</label>
                <div className="payment-demo"><span>測試付款流程</span><p>此展示版不會收取費用；正式上線前需串接合法金流服務。</p></div>
                <button className="purchase-button" type="submit">建立測試訂單 <span>→</span></button>
              </form>
            ) : (
              <div className="order-complete">
                <div className="seal">N</div><p>紀念登錄已建立</p><h2>{desiredName}</h2><span>對應候選天體 {selected.id}</span>
                <div><small>登錄編號</small><b>{orderDone}</b></div>
                <button onClick={() => setCheckout(false)}>完成</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
