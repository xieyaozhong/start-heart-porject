import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { namingOrders } from "@/db/schema";
import { buildEcpayCheckout } from "@/lib/ecpay";
import { ensureUniverseSeeded } from "@/lib/universe";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
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
    await db.update(namingOrders).set({ status: "payment_pending", paymentMessage: checkout.mode === "test" ? "Preparing ECPay test checkout" : "Preparing secure ECPay checkout", paymentUpdatedAt: new Date().toISOString() }).where(eq(namingOrders.id, order.id));
    const fields = Object.entries(checkout.parameters).map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`).join("");
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Continue to secure ECPay checkout</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050c13;color:#e6edef;font-family:Arial,sans-serif}.card{text-align:center;padding:42px;border:1px solid rgba(145,177,193,.2);background:#0a1721}.mark{width:52px;height:52px;margin:0 auto 20px;display:grid;place-items:center;border:1px solid #ffad43;color:#ffad43;font:italic 24px Georgia,serif;animation:pulse 1.5s ease-in-out infinite}p{color:#8297a1;font-size:12px}small{display:block;color:#5f7783;margin-top:14px}button{margin-top:20px;padding:10px 15px;border:1px solid #ffad43;background:none;color:#ffd087}@keyframes pulse{50%{transform:rotate(180deg) scale(.86)}}</style></head><body><form class="card" id="ecpay" method="post" action="${escapeHtml(checkout.action)}"><div class="mark">N</div><h1>Continuing to secure ECPay checkout</h1><p>${checkout.mode === "test" ? "This is a test environment. No real charge will be made." : "You are leaving NOCTUA to complete payment on ECPay’s encrypted page."}</p>${fields}<button type="submit">CONTINUE IF NOT REDIRECTED</button><small>Please keep this page open</small></form><script>document.getElementById('ecpay').submit()</script></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to initialise payment.", { status: 500 });
  }
}
