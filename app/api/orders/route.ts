import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { namingOrders, namingPackages, starSystems } from "@/db/schema";
import { ensureUniverseSeeded } from "@/lib/universe";

export async function POST(request: Request) {
  try {
    await ensureUniverseSeeded();
    const payload = await request.json() as Record<string, unknown>;
    const packageId = String(payload.packageId ?? "");
    const systemId = String(payload.systemId ?? "");
    const desiredName = String(payload.desiredName ?? "").trim();
    const ownerName = String(payload.ownerName ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const db = getDb();
    const [[plan], [system]] = await Promise.all([
      db.select().from(namingPackages).where(eq(namingPackages.id, packageId)),
      db.select().from(starSystems).where(eq(starSystems.id, systemId)),
    ]);
    if (!plan?.active || !system || !desiredName || !ownerName || !email.includes("@")) {
      return Response.json({ error: "命名登錄資料不完整" }, { status: 400 });
    }
    const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const [order] = await db.insert(namingOrders).values({
      id, candidateId: systemId, systemId, planetId: payload.planetId ? String(payload.planetId) : null, desiredName: desiredName.slice(0, 40), ownerName: ownerName.slice(0, 60), dedication: String(payload.dedication ?? "").slice(0, 240), email: email.slice(0, 160), packageName: plan.name, amountTwd: plan.priceTwd, status: "pending",
    }).returning();
    return Response.json({ order, message: "登錄申請已建立，管理員確認付款後會產生專屬編號。" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "訂單建立失敗" }, { status: 500 });
  }
}
