import { getPublicUniverse } from "@/lib/universe";

export async function GET() {
  try {
    return Response.json(await getPublicUniverse(), { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Celestial-system data is temporarily unavailable." }, { status: 500 });
  }
}
