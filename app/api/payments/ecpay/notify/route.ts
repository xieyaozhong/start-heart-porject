import { processEcpayCallback } from "@/lib/ecpay";

export async function POST(request: Request) {
  try {
    const result = await processEcpayCallback(await request.formData());
    return new Response(result.ok ? "1|OK" : "0|Error", { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch {
    return new Response("0|Error", { status: 500, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  }
}
