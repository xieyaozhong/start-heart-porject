"use client";

import { FormEvent, useEffect, useState } from "react";
import "./admin.css";
import "./payment.css";

type SystemRow = { id: string; designation: string; classification: string; status: string; confidence: number; createdAt: string; planets: unknown[] };
type PackageRow = { id: string; name: string; priceTwd: number; description: string; features: string[]; active: boolean };
type OrderRow = { id: string; desiredName: string; ownerName: string | null; packageName: string; amountTwd: number; status: string; registryCode: string | null; createdAt: string; paymentProvider: string | null; paymentTradeNo: string | null; paymentType: string | null; paymentMessage: string | null; simulatedPayment: boolean };
type RunRow = { id: string; source: string; status: string; generatedSystemId: string | null; startedAt: string };
type Dashboard = { systems: SystemRow[]; packages: PackageRow[]; orders: OrderRow[]; runs: RunRow[]; settings: Record<string, string>; payment: { provider: string; mode: "test" | "production"; merchantConfigured: boolean } };

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [authState, setAuthState] = useState<"checking" | "login" | "ready">("checking");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "systems" | "packages" | "orders">("overview");

  async function load() {
    const response = await fetch("/api/admin/control", { credentials: "include" });
    if (response.status === 401) return setAuthState("login");
    const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "後台載入失敗");
    setDashboard(data); setAuthState("ready");
  }
  useEffect(() => { load().catch((reason) => { setError(reason.message); setAuthState("login"); }); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy("login"); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) });
    const data = await response.json(); setBusy(""); if (!response.ok) return setError(data.error ?? "登入失敗"); await load();
  }

  async function action(payload: Record<string, unknown>, label: string) {
    setBusy(label); setError("");
    const response = await fetch("/api/admin/control", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setBusy(""); if (!response.ok) return setError(data.error ?? "操作失敗"); setDashboard(data.dashboard);
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); setDashboard(null); setAuthState("login"); }

  if (authState !== "ready" || !dashboard) return <main className="admin-login"><form onSubmit={login}><a href="/">← 返回前台</a><div className="admin-mark">N</div><p>NOCTUA CONTROL CENTER</p><h1>管理控制台</h1><label>管理密碼<input name="password" required type="password" autoComplete="current-password" /></label>{error && <span>{error}</span>}<button disabled={busy === "login"}>{busy ? "驗證中…" : "登入後台 →"}</button><small>此後台使用獨立管理密碼，不需要 ChatGPT 帳號。</small></form></main>;

  const published = dashboard.systems.filter((item) => item.status === "published").length;
  const candidates = dashboard.systems.filter((item) => item.status !== "published").length;
  const pendingOrders = dashboard.orders.filter((item) => item.status !== "confirmed").length;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><span>N</span><div><b>NOCTUA</b><small>CONTROL CENTER</small></div></a><nav>{[["overview","總覽"],["systems","星體發布"],["packages","命名方案"],["orders","訂單與登錄"]].map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as typeof tab)}><i />{label}</button>)}</nav><div><a href="/">開啟公開前台 ↗</a><button onClick={logout}>登出</button></div></aside>
    <section className="admin-main"><header><div><p>INFERENCE OPERATIONS</p><h1>{tab === "overview" ? "系統總覽" : tab === "systems" ? "星體推算與發布" : tab === "packages" ? "命名方案管理" : "訂單、付款與專屬登錄"}</h1></div><span><i /> 排程服務在線 · {dashboard.payment.provider} {dashboard.payment.mode === "test" ? "測試中" : "正式收款"}</span></header>{error && <div className="admin-error">{error}</div>}
      {tab === "overview" && <><div className="stats-grid"><article><span>已發布星系</span><b>{published}</b><small>PUBLIC SYSTEMS</small></article><article><span>待審核候選</span><b>{candidates}</b><small>REVIEW QUEUE</small></article><article><span>等待確認訂單</span><b>{pendingOrders}</b><small>PENDING ORDERS</small></article><article><span>推算執行次數</span><b>{dashboard.runs.length}</b><small>INFERENCE RUNS</small></article></div><div className="admin-grid"><article className="admin-card"><div className="card-head"><div><span>排程設定</span><small>SCHEDULE</small></div></div><form className="schedule-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); action({ action: "save_schedule", frequency: form.get("frequency"), enabled: form.get("enabled") === "on", autoPublish: form.get("autoPublish") === "on" }, "schedule"); }}><label>推算頻率<select name="frequency" defaultValue={dashboard.settings.schedule_frequency ?? "daily"}><option value="daily">每日</option><option value="weekly">每週</option><option value="monthly">每月</option></select></label><label className="check"><input name="enabled" type="checkbox" defaultChecked={dashboard.settings.schedule_enabled === "true"} />啟用 GitHub 排程推算</label><label className="check"><input name="autoPublish" type="checkbox" defaultChecked={dashboard.settings.auto_publish === "true"} />推算完成後自動公開</label><button>儲存排程</button></form></article><article className="admin-card"><div className="card-head"><div><span>最近推算</span><small>RECENT RUNS</small></div><button onClick={() => action({ action: "run_inference" }, "run")} disabled={Boolean(busy)}>{busy === "run" ? "推算中…" : "＋ 立即推算"}</button></div><div className="run-list">{dashboard.runs.length ? dashboard.runs.slice(0,5).map((run) => <div key={run.id}><i className={run.status} /><span><b>{run.generatedSystemId ?? "執行中"}</b><small>{run.source === "schedule" ? "排程" : "手動"} · {new Date(run.startedAt).toLocaleString("zh-TW")}</small></span><em>{run.status}</em></div>) : <p>尚無推算紀錄</p>}</div></article></div></>}
      {tab === "systems" && <div className="admin-card wide"><div className="card-head"><div><span>候選星體工作台</span><small>{dashboard.systems.length} SYSTEMS</small></div><button onClick={() => action({ action: "run_inference" }, "run")} disabled={Boolean(busy)}>{busy === "run" ? "模型計算中…" : "＋ 執行新推算"}</button></div><div className="admin-table systems-table"><div className="table-row table-head"><span>系統</span><span>類型</span><span>行星</span><span>信心</span><span>狀態</span><span>操作</span></div>{dashboard.systems.map((item) => <div className="table-row" key={item.id}><span><b>{item.designation}</b><small>{item.id}</small></span><span>{item.classification}</span><span>{item.planets.length}</span><span>{item.confidence}%</span><span><i className={`status ${item.status}`} />{item.status === "published" ? "已公開" : "待審核"}</span><span><button onClick={() => action({ action: "publish", id: item.id, published: item.status !== "published" }, `publish-${item.id}`)}>{item.status === "published" ? "撤下" : "發布"}</button></span></div>)}</div></div>}
      {tab === "packages" && <div className="admin-grid packages-admin"><article className="admin-card"><div className="card-head"><div><span>現有方案</span><small>ACTIVE CATALOG</small></div></div><div className="package-admin-list">{dashboard.packages.map((item) => <div key={item.id}><span><b>{item.name}</b><small>{item.description}</small></span><em>NT$ {item.priceTwd.toLocaleString()}</em><button onClick={() => action({ action: "save_package", ...item, active: !item.active }, `package-${item.id}`)}>{item.active ? "停用" : "啟用"}</button></div>)}</div></article><article className="admin-card"><div className="card-head"><div><span>發布新方案</span><small>NEW PACKAGE</small></div></div><form className="package-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); action({ action: "save_package", name: form.get("name"), priceTwd: Number(form.get("price")), description: form.get("description"), features: String(form.get("features")).split("\n").filter(Boolean), active: true }, "new-package").then(() => event.currentTarget.reset()); }}><label>方案名稱<input name="name" required /></label><label>售價（TWD）<input name="price" required type="number" min="0" /></label><label>說明<textarea name="description" required rows={3} /></label><label>功能（每行一項）<textarea name="features" required rows={5} /></label><button disabled={Boolean(busy)}>發布新方案</button></form></article></div>}
      {tab === "orders" && <div className="admin-card wide"><div className="payment-mode-banner"><div><span>THIRD-PARTY PAYMENT</span><b>{dashboard.payment.provider}</b></div><p>{dashboard.payment.mode === "test" ? "目前為測試環境：測試交易不會扣款，也不會自動核發真實命名權。" : "正式環境已啟用：通過簽章、金額與付款狀態驗證後，系統會自動核發專屬編號。"}</p><em>{dashboard.payment.mode === "test" ? "TEST MODE" : "LIVE"}</em></div><div className="card-head"><div><span>命名登錄訂單</span><small>{dashboard.orders.length} ORDERS</small></div></div><div className="admin-table orders-table"><div className="table-row table-head"><span>訂單／交易號</span><span>紀念名稱／持有者</span><span>方案</span><span>金額</span><span>付款狀態／編號</span><span>操作</span></div>{dashboard.orders.map((item) => <div className="table-row" key={item.id}><span><b>{item.id}</b><small>{item.paymentTradeNo ?? new Date(item.createdAt).toLocaleDateString("zh-TW")}</small></span><span><b>{item.desiredName}</b><small>{item.ownerName}</small></span><span>{item.packageName}<small>{item.paymentType ?? item.paymentProvider ?? "尚未付款"}</small></span><span>NT$ {item.amountTwd.toLocaleString()}</span><span><i className={`status ${item.status}`} />{item.registryCode ?? (item.status === "test_paid" ? "測試付款完成" : item.status === "payment_pending" ? "等待第三方付款" : item.status === "payment_failed" ? "付款失敗" : item.status === "payment_review" ? "需人工核對" : "等待確認")}{item.paymentMessage && <small>{item.paymentMessage}</small>}</span><span>{item.status === "confirmed" ? <b className="confirmed">已付款／核發</b> : <button onClick={() => action({ action: "approve_order", id: item.id }, `order-${item.id}`)}>人工確認並核發</button>}</span></div>)}</div></div>}
    </section>
  </main>;
}
