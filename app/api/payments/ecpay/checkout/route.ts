import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { namingOrders } from "@/db/schema";
import { buildEcpayCheckout } from "@/lib/ecpay";
import { usdFromTwd } from "@/lib/pricing";
import { ensureUniverseSeeded } from "@/lib/universe";

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[character] ?? character);
}

export async function GET(request: Request) {
  try {
    await ensureUniverseSeeded();
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order") ?? "";
    const token = url.searchParams.get("token") ?? "";
    const db = getDb();
    const [order] = await db.select().from(namingOrders).where(and(eq(namingOrders.id, orderId), eq(namingOrders.paymentToken, token)));
    if (!order) return new Response("Payment order not found.", { status: 404 });
    if (order.status === "confirmed") return Response.redirect(`${url.origin}/payment/result?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}`, 303);

    const checkout = await buildEcpayCheckout(order, url.origin);
    await db.update(namingOrders).set({
      status: "payment_pending",
      paymentMessage: checkout.mode === "test" ? "Preparing ECPay test checkout" : "Preparing secure ECPay checkout",
      paymentUpdatedAt: new Date().toISOString(),
    }).where(eq(namingOrders.id, order.id));

    const fields = Object.entries(checkout.parameters)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
      .join("");
    const handoffCopy = checkout.mode === "test"
      ? "You are entering ECPay's test environment. The full handoff can be tested safely and no real charge will be made."
      : "Continue to ECPay's encrypted page to choose your payment method and complete the one-time registry.";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Secure checkout ready — NOCTUA</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;grid-template-rows:1fr auto;place-items:center;padding:28px;background:radial-gradient(circle at 50% 25%,rgba(38,96,119,.32),transparent 32rem),#03080c;color:#eef2f1;font-family:Arial,sans-serif}.card{width:min(560px,100%);text-align:center;padding:50px 46px;border:1px solid rgba(169,198,210,.2);border-radius:24px;background:linear-gradient(145deg,rgba(14,34,45,.97),rgba(5,15,22,.98));box-shadow:0 50px 150px rgba(0,0,0,.52)}.mark{width:62px;height:62px;margin:0 auto 24px;display:grid;place-items:center;border:1px solid #f3a84d;color:#f3a84d;font:italic 27px Georgia,serif;transform:rotate(-7deg)}.kicker{color:#f3a84d;font:8px monospace;letter-spacing:.16em}.card h1{margin:10px 0 13px;font:400 39px/1.08 Georgia,serif}.copy{margin:0 auto 24px;max-width:430px;color:#8fa3ac;font-size:12px;line-height:1.7}.summary{margin:0 0 22px;border-top:1px solid rgba(169,198,210,.14);border-bottom:1px solid rgba(169,198,210,.14);text-align:left}.summary div{display:flex;justify-content:space-between;gap:18px;padding:12px 2px;border-bottom:1px solid rgba(169,198,210,.09)}.summary div:last-child{border-bottom:0}.summary span{color:#667f89;font-size:8px}.summary b{font:10px monospace;color:#dce5e6;text-align:right}button{width:100%;padding:14px 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#f6c273,#e9993b);color:#10171b;font-weight:700;font-size:10px;cursor:pointer}button:hover{filter:brightness(1.06)}small{display:block;color:#607782;margin-top:14px;font-size:8px;line-height:1.6}.back{display:inline-block;margin-top:18px;color:#8197a1;font-size:9px;text-decoration:none}.footer{align-self:end;width:100%;display:flex;justify-content:space-between;padding-top:22px;border-top:1px solid rgba(169,198,210,.12);color:#526b76;font-size:8px}@media(max-width:600px){body{padding:18px}.card{padding:38px 22px}.card h1{font-size:33px}.footer{gap:8px;flex-direction:column}}</style></head><body><form class="card" id="ecpay" method="post" target="_top" action="${escapeHtml(checkout.action)}"><div class="mark">N</div><p class="kicker">NOCTUA / SECURE HANDOFF</p><h1>Your checkout is ready</h1><p class="copy">${handoffCopy}</p><div class="summary"><div><span>ORDER</span><b>${escapeHtml(order.id)}</b></div><div><span>MEMORIAL NAME</span><b>${escapeHtml(order.desiredName)}</b></div><div><span>PLAN PRICE</span><b>US$ ${usdFromTwd(order.amountTwd).toLocaleString("en-US")}</b></div><div><span>ECPAY SETTLEMENT</span><b>NT$ ${order.amountTwd.toLocaleString("en-US")}</b></div></div>${fields}<button type="submit">CONTINUE TO ECPAY →</button><small>ECPay accepts New Taiwan dollars only. The settlement amount uses NOCTUA's fixed 30:1 catalog basis (NT$30 per US$1); it is not a live foreign-exchange quotation.</small><a class="back" href="${url.origin}/#registry">Return to NOCTUA</a></form><div class="footer"><span>PAYMENT DETAILS ARE ENTERED ONLY ON ECPAY</span><span>NOCTUA NEVER STORES CARD NUMBERS</span></div></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to initialise payment.", { status: 500 });
  }
}
