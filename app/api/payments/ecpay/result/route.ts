import { processEcpayCallback } from "@/lib/ecpay";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const result = await processEcpayCallback(await request.formData());
    if (!result.ok || !result.orderId || !result.token) return Response.redirect(`${origin}/payment/result?error=verification`, 303);
    return Response.redirect(`${origin}/payment/result?order=${encodeURIComponent(result.orderId)}&token=${encodeURIComponent(result.token)}`, 303);
  } catch {
    return Response.redirect(`${origin}/payment/result?error=processing`, 303);
  }
}
