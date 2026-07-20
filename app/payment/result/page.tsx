"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentOrder = {
  id: string;
  desiredName: string;
  packageName: string;
  amountTwd: number;
  status: string;
  registryCode: string | null;
  paymentType: string | null;
  paymentMessage: string | null;
  simulatedPayment: boolean;
  gateway: { provider: string; mode: "test" | "production" };
};

const presentation: Record<string, { mark: string; title: string; body: string }> = {
  confirmed: { mark: "✓", title: "付款成功，命名權已核發", body: "綠界已確認款項，專屬恆星體系編號已建立。" },
  test_paid: { mark: "T", title: "綠界測試付款完成", body: "這是測試交易，未產生扣款，也不會自動核發真實命名權。" },
  payment_pending: { mark: "…", title: "正在等待付款結果", body: "綠界可能仍在處理交易；此頁會自動更新狀態。" },
  payment_failed: { mark: "×", title: "付款未完成", body: "交易沒有成功，你可以返回方案頁重新建立訂單。" },
  payment_review: { mark: "!", title: "付款需要人工核對", body: "付款金額或交易資訊與訂單不一致，請暫勿重複付款。" },
};

export default function PaymentResultPage() {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order") ?? "";
    const token = params.get("token") ?? "";
    let active = true;
    if (!orderId || !token) {
      queueMicrotask(() => { if (active) setError(params.has("error") ? "付款資料驗證失敗，請回到網站或聯絡管理員。" : "缺少付款查詢資料。"); });
      return () => { active = false; };
    }
    let timer: number | undefined;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/status?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "付款狀態載入失敗");
        if (!active) return;
        setOrder(data.order);
        if (data.order.status === "payment_pending") timer = window.setTimeout(load, 3500);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "付款狀態載入失敗");
      }
    };
    load();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, []);

  const state = order ? (presentation[order.status] ?? presentation.payment_pending) : null;
  return <main className="payment-result-page">
    <Link className="payment-brand" href="/"><span>N</span><div><b>NOCTUA</b><small>SECURE PAYMENT</small></div></Link>
    <section className={order ? `payment-result-card ${order.status}` : "payment-result-card"}>
      {error ? <><div className="payment-result-mark error">!</div><p className="payment-kicker">PAYMENT VERIFICATION</p><h1>無法確認付款狀態</h1><p className="payment-result-copy">{error}</p><Link className="payment-main-action" href="/#registry">返回命名方案</Link></> : !order || !state ? <><div className="payment-result-mark loading">N</div><p className="payment-kicker">SECURE PAYMENT</p><h1>正在確認付款資訊</h1><p className="payment-result-copy">請稍候，不要關閉此頁面。</p></> : <>
        <div className="payment-result-mark">{state.mark}</div>
        <p className="payment-kicker">{order.gateway.provider} · {order.gateway.mode === "test" ? "TEST MODE" : "VERIFIED PAYMENT"}</p>
        <h1>{state.title}</h1>
        <p className="payment-result-copy">{state.body}</p>
        {order.gateway.mode === "test" && <div className="payment-test-notice"><b>測試環境</b><span>畫面與回呼流程皆為真實介接，但不會向信用卡或銀行帳戶扣款。</span></div>}
        <div className="payment-order-summary"><div><span>訂單編號</span><b>{order.id}</b></div><div><span>紀念名稱</span><b>{order.desiredName}</b></div><div><span>方案／金額</span><b>{order.packageName} · NT$ {order.amountTwd.toLocaleString()}</b></div>{order.paymentType && <div><span>付款方式</span><b>{order.paymentType}</b></div>}</div>
        {order.registryCode && <div className="payment-registry"><span>專屬恆星體系編號</span><strong>{order.registryCode}</strong><small>請保存此編號，回到持有者入口即可開啟專屬星系。</small></div>}
        {order.paymentMessage && order.status !== "confirmed" && <p className="payment-gateway-message">金流訊息：{order.paymentMessage}</p>}
        <div className="payment-result-actions"><Link className="payment-main-action" href={order.registryCode ? `/?registry=${encodeURIComponent(order.registryCode)}` : "/#registry"}>{order.registryCode ? "前往持有者入口" : "返回 NOCTUA"}</Link><Link href="/resources">查看天文機構資料</Link></div>
      </>}
    </section>
    <footer className="payment-footer"><span>付款由綠界科技處理，NOCTUA 不儲存信用卡或銀行帳號資料。</span><a href="https://www.ecpay.com.tw/" target="_blank" rel="noreferrer noopener">ECPay 綠界科技 ↗</a></footer>
  </main>;
}
