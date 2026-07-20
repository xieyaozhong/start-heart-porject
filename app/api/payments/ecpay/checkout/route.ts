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
    if (!order) return new Response("找不到付款訂單", { status: 404 });
    if (order.status === "confirmed") return Response.redirect(`${url.origin}/payment/result?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}`, 303);

    const checkout = await buildEcpayCheckout(order, url.origin);
    await db.update(namingOrders).set({ status: "payment_pending", paymentMessage: checkout.mode === "test" ? "準備進入綠界測試付款" : "準備進入綠界安全付款", paymentUpdatedAt: new Date().toISOString() }).where(eq(namingOrders.id, order.id));
    const fields = Object.entries(checkout.parameters).map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`).join("");
    const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>前往綠界安全付款</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050c13;color:#e6edef;font-family:Arial,sans-serif}.card{text-align:center;padding:42px;border:1px solid rgba(145,177,193,.2);background:#0a1721}.mark{width:52px;height:52px;margin:0 auto 20px;display:grid;place-items:center;border:1px solid #ffad43;color:#ffad43;font:italic 24px Georgia,serif;animation:pulse 1.5s ease-in-out infinite}p{color:#8297a1;font-size:12px}small{display:block;color:#5f7783;margin-top:14px}button{margin-top:20px;padding:10px 15px;border:1px solid #ffad43;background:none;color:#ffd087}@keyframes pulse{50%{transform:rotate(180deg) scale(.86)}}</style></head><body><form class="card" id="ecpay" method="post" action="${escapeHtml(checkout.action)}"><div class="mark">N</div><h1>正在前往綠界安全付款</h1><p>${checkout.mode === "test" ? "目前為測試環境，不會產生真實扣款。" : "即將離開 NOCTUA，請在綠界加密頁面完成付款。"}</p>${fields}<button type="submit">若未自動前往，請點此繼續</button><small>請勿關閉此頁面</small></form><script>document.getElementById('ecpay').submit()</script></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "付款初始化失敗", { status: 500 });
  }
}
