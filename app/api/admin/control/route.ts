import { isAdminRequest } from "@/lib/admin-auth";
import { approveOrder, getAdminDashboard, publishResearchUpdate, publishSystem, runInference, savePackage, saveSchedule } from "@/lib/universe";

function unauthorized() {
  return Response.json({ error: "需要管理員權限" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    return Response.json(await getAdminDashboard());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "後台資料載入失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = String(payload.action ?? "");
    let result: unknown = null;
    if (action === "run_inference") result = await runInference("admin");
    else if (action === "publish") await publishSystem(String(payload.id), Boolean(payload.published));
    else if (action === "save_schedule") await saveSchedule(String(payload.frequency), Boolean(payload.enabled), Boolean(payload.autoPublish));
    else if (action === "save_package") await savePackage({ id: payload.id ? String(payload.id) : undefined, name: String(payload.name), priceTwd: Number(payload.priceTwd), description: String(payload.description), features: Array.isArray(payload.features) ? payload.features.map(String) : [], active: Boolean(payload.active) });
    else if (action === "publish_update") result = await publishResearchUpdate({ systemId: String(payload.systemId), title: String(payload.title), summary: String(payload.summary), observingNote: String(payload.observingNote), symbolicMeaning: String(payload.symbolicMeaning) });
    else if (action === "approve_order") result = { registryCode: await approveOrder(String(payload.id)) };
    else return Response.json({ error: "未知的後台操作" }, { status: 400 });
    return Response.json({ ok: true, result, dashboard: await getAdminDashboard() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "操作失敗" }, { status: 500 });
  }
}
