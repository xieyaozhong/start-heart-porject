import { adminSessionCookie, createAdminSession, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { password?: string };
    if (!payload.password || !(await verifyAdminPassword(payload.password))) {
      return Response.json({ error: "管理密碼不正確" }, { status: 401 });
    }
    return Response.json({ ok: true }, { headers: { "set-cookie": adminSessionCookie(await createAdminSession()) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登入失敗" }, { status: 500 });
  }
}
