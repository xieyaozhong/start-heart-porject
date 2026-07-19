import { getDb } from "@/db";
import { namingOrders } from "@/db/schema";

const prices: Record<string, number> = { "探索者": 680, "觀測者": 1280, "典藏者": 2680 };

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const packageName = String(payload.packageName ?? "");
    const desiredName = String(payload.desiredName ?? "").trim();
    const email = String(payload.email ?? "").trim();
    if (!payload.id || !payload.candidateId || !desiredName || !email || !prices[packageName]) {
      return Response.json({ error: "訂單資料不完整" }, { status: 400 });
    }
    const [order] = await getDb().insert(namingOrders).values({
      id: String(payload.id),
      candidateId: String(payload.candidateId),
      desiredName: desiredName.slice(0, 40),
      email: email.slice(0, 160),
      packageName,
      amountTwd: prices[packageName],
      status: "test_order",
    }).returning();
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "訂單建立失敗" }, { status: 500 });
  }
}
