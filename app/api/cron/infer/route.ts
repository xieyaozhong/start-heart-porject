import { isCronRequest } from "@/lib/admin-auth";
import { getAdminDashboard, runInference } from "@/lib/universe";

export async function POST(request: Request) {
  if (!isCronRequest(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const dashboard = await getAdminDashboard();
    if (dashboard.settings.schedule_enabled !== "true") return Response.json({ ok: true, skipped: "disabled" });
    const frequency = dashboard.settings.schedule_frequency ?? "daily";
    const hours = frequency === "weekly" ? 24 * 7 : frequency === "monthly" ? 24 * 28 : 20;
    const latest = dashboard.runs.find((run) => run.source === "schedule" && run.status === "completed");
    if (latest && Date.now() - new Date(latest.startedAt).getTime() < hours * 60 * 60 * 1000) {
      return Response.json({ ok: true, skipped: "not_due" });
    }
    return Response.json({ ok: true, system: await runInference("schedule") });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "scheduled inference failed" }, { status: 500 });
  }
}
