import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { candidates } from "@/db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(candidates).orderBy(desc(candidates.createdAt)).limit(50);
    return Response.json({ candidates: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "紀錄庫暫時無法使用" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    if (!payload.id || !payload.type) return Response.json({ error: "缺少候選資料" }, { status: 400 });
    const [candidate] = await getDb().insert(candidates).values({
      id: String(payload.id),
      createdAt: String(payload.createdAt),
      raHours: Number(payload.raHours),
      decDeg: Number(payload.decDeg),
      predictedRa: Number(payload.predictedRa),
      predictedDec: Number(payload.predictedDec),
      distancePc: Number(payload.distancePc),
      periodDays: Number(payload.periodDays),
      minimumMassJupiter: Number(payload.minimumMassJupiter),
      radiusEarth: Number(payload.radiusEarth),
      semiMajorAu: Number(payload.semiMajorAu),
      angularSeparationMas: Number(payload.angularSeparationMas),
      equilibriumTemp: Number(payload.equilibriumTemp),
      type: String(payload.type),
      confidence: Number(payload.confidence),
      probabilitiesJson: JSON.stringify(payload.probabilities ?? []),
    }).returning();
    return Response.json({ candidate }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "儲存失敗" }, { status: 500 });
  }
}
