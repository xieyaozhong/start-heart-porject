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
      return Response.json({ error: "The registry order is incomplete." }, { status: 400 });
    }
    const nonce = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const id = `ORD-${timestamp}${nonce}`;
    const paymentTradeNo = `N${timestamp}${nonce}`.slice(0, 20);
    const paymentToken = crypto.randomUUID().replaceAll("-", "");
    const publicPackageName = ({ "PKG-EXPLORER": "Explorer", "PKG-OBSERVER": "Observer", "PKG-ARCHIVIST": "Archivist" } as Record<string, string>)[plan.id] ?? (/^[\x00-\x7F]*$/.test(plan.name) ? plan.name : "Celestial Registry");
    const [order] = await db.insert(namingOrders).values({
      id, candidateId: systemId, systemId, planetId: payload.planetId ? String(payload.planetId) : null, desiredName: desiredName.slice(0, 40), ownerName: ownerName.slice(0, 60), dedication: String(payload.dedication ?? "").slice(0, 240), email: email.slice(0, 160), packageName: publicPackageName, amountTwd: plan.priceTwd, status: "payment_pending", paymentProvider: "ecpay", paymentTradeNo, paymentToken, paymentMessage: "Order created and awaiting secure ECPay checkout", paymentUpdatedAt: new Date().toISOString(),
    }).returning();
    const checkoutUrl = `/api/payments/ecpay/checkout?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(paymentToken)}`;
    return Response.json({ order: { id: order.id, amountTwd: order.amountTwd, status: order.status }, checkoutUrl, message: "Order created. Preparing secure ECPay checkout." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create the order." }, { status: 500 });
  }
}
