import { findRegistry } from "@/lib/universe";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) return Response.json({ error: "請輸入登錄編號" }, { status: 400 });
  try {
    const registry = await findRegistry(code);
    if (!registry) return Response.json({ error: "找不到已確認的紀念登錄" }, { status: 404 });
    return Response.json({ registry });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "查詢失敗" }, { status: 500 });
  }
}
