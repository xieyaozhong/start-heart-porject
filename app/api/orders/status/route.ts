import { getPaymentOrderStatus } from "@/lib/ecpay";
import { ensureUniverseSeeded } from "@/lib/universe";

export async function GET(request: Request) {
  try {
    await ensureUniverseSeeded();
    const url = new URL(request.url);
    const order = await getPaymentOrderStatus(url.searchParams.get("order") ?? "", url.searchParams.get("token") ?? "");
    if (!order) return Response.json({ error: "找不到付款紀錄" }, { status: 404 });
    return Response.json({ order }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "付款狀態載入失敗" }, { status: 500 });
  }
}
