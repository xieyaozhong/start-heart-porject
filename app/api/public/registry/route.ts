import { findRegistry } from "@/lib/universe";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) return Response.json({ error: "Enter a registry number." }, { status: 400 });
  try {
    const registry = await findRegistry(code);
    if (!registry) return Response.json({ error: "No confirmed memorial registry was found." }, { status: 404 });
    return Response.json({ registry });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Registry lookup failed." }, { status: 500 });
  }
}
