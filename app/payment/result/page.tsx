"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentOrder = {
  id: string;
  desiredName: string;
  packageName: string;
  amountUsd: number;
  amountTwd: number;
  status: string;
  registryCode: string | null;
  paymentType: string | null;
  paymentMessage: string | null;
  simulatedPayment: boolean;
  gateway: { provider: string; mode: "test" | "production" };
};

const presentation: Record<string, { mark: string; title: string; body: string }> = {
  confirmed: { mark: "✓", title: "Payment confirmed. Your registry is ready.", body: "ECPay has confirmed the transaction and your unique stellar-system registry number has been issued." },
  test_paid: { mark: "T", title: "ECPay test payment completed", body: "This was a simulated transaction. No funds were charged and no real naming right was issued." },
  payment_pending: { mark: "…", title: "Waiting for payment confirmation", body: "ECPay may still be processing the transaction. This page will refresh the status automatically." },
  payment_failed: { mark: "×", title: "Payment was not completed", body: "The transaction was unsuccessful. Return to the registry plans when you are ready to create a new order." },
  payment_review: { mark: "!", title: "Payment requires manual review", body: "The payment amount or transaction details do not match the order. Please avoid submitting a duplicate payment." },
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
      queueMicrotask(() => { if (active) setError(params.has("error") ? "Payment verification failed. Return to NOCTUA or contact the administrator." : "Payment lookup details are missing."); });
      return () => { active = false; };
    }
    let timer: number | undefined;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/status?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load the payment status.");
        if (!active) return;
        setOrder(data.order);
        if (data.order.status === "payment_pending") timer = window.setTimeout(load, 3500);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load the payment status.");
      }
    };
    load();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, []);

  const state = order ? (presentation[order.status] ?? presentation.payment_pending) : null;
  return <main className="payment-result-page public-site">
    <Link className="payment-brand" href="/"><span>N</span><div><b>NOCTUA</b><small>SECURE PAYMENT</small></div></Link>
    <section className={order ? `payment-result-card ${order.status}` : "payment-result-card"}>
      {error ? <><div className="payment-result-mark error">!</div><p className="payment-kicker">PAYMENT VERIFICATION</p><h1>We could not verify this payment</h1><p className="payment-result-copy">{error}</p><Link className="payment-main-action" href="/#registry">RETURN TO REGISTRY PLANS</Link></> : !order || !state ? <><div className="payment-result-mark loading">N</div><p className="payment-kicker">SECURE PAYMENT</p><h1>Verifying your payment</h1><p className="payment-result-copy">Please keep this page open for a moment.</p></> : <>
        <div className="payment-result-mark">{state.mark}</div>
        <p className="payment-kicker">{order.gateway.provider} · {order.gateway.mode === "test" ? "TEST MODE" : "VERIFIED PAYMENT"}</p>
        <h1>{state.title}</h1>
        <p className="payment-result-copy">{state.body}</p>
        {order.gateway.mode === "test" && <div className="payment-test-notice"><b>TEST ENVIRONMENT</b><span>The checkout and callback flow are fully integrated, but no credit card or bank account will be charged.</span></div>}
        <div className="payment-order-summary"><div><span>ORDER NUMBER</span><b>{order.id}</b></div><div><span>MEMORIAL NAME</span><b>{order.desiredName}</b></div><div><span>PLAN / AMOUNT</span><b>{order.packageName} · US$ {order.amountUsd.toLocaleString()}</b></div><div><span>ECPAY SETTLEMENT</span><b>NT$ {order.amountTwd.toLocaleString()}</b></div>{order.paymentType && <div><span>PAYMENT METHOD</span><b>{order.paymentType}</b></div>}</div>
        {order.registryCode && <div className="payment-registry"><span>UNIQUE STELLAR-SYSTEM REGISTRY</span><strong>{order.registryCode}</strong><small>Keep this number. Use Holder Access on NOCTUA to open your private system at any time.</small></div>}
        {order.paymentMessage && order.status !== "confirmed" && <p className="payment-gateway-message">GATEWAY MESSAGE: {order.paymentMessage}</p>}
        <div className="payment-result-actions"><Link className="payment-main-action" href={order.registryCode ? `/?registry=${encodeURIComponent(order.registryCode)}` : "/#registry"}>{order.registryCode ? "OPEN HOLDER ACCESS" : "RETURN TO NOCTUA"}</Link><Link href="/resources">VIEW ASTRONOMY INSTITUTIONS</Link></div>
      </>}
    </section>
    <footer className="payment-footer"><span>Payments are processed by ECPay. NOCTUA never stores credit-card or bank-account details.</span><a href="https://www.ecpay.com.tw/" target="_blank" rel="noreferrer noopener">ECPay ↗</a></footer>
  </main>;
}
