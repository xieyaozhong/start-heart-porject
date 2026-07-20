import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { namingOrders } from "@/db/schema";

type PaymentRuntimeEnv = {
  ECPAY_MODE?: string;
  ECPAY_MERCHANT_ID?: string;
  ECPAY_HASH_KEY?: string;
  ECPAY_HASH_IV?: string;
};

type EcpayConfig = {
  mode: "test" | "production";
  merchantId: string;
  hashKey: string;
  hashIv: string;
  checkoutUrl: string;
};

const TEST_CONFIG = {
  merchantId: "3002607",
  hashKey: "pwFHCqoQZGmho4w6",
  hashIv: "EkRm7iFT261dpevs",
  checkoutUrl: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

export function getEcpayConfig(): EcpayConfig {
  const runtime = env as unknown as PaymentRuntimeEnv;
  const production = runtime.ECPAY_MODE?.toLowerCase() === "production";
  if (!production) {
    return {
      mode: "test",
      merchantId: runtime.ECPAY_MERCHANT_ID || TEST_CONFIG.merchantId,
      hashKey: runtime.ECPAY_HASH_KEY || TEST_CONFIG.hashKey,
      hashIv: runtime.ECPAY_HASH_IV || TEST_CONFIG.hashIv,
      checkoutUrl: TEST_CONFIG.checkoutUrl,
    };
  }
  if (!runtime.ECPAY_MERCHANT_ID || !runtime.ECPAY_HASH_KEY || !runtime.ECPAY_HASH_IV) {
    throw new Error("Production checkout requires a configured ECPay merchant ID and security keys.");
  }
  return {
    mode: "production",
    merchantId: runtime.ECPAY_MERCHANT_ID,
    hashKey: runtime.ECPAY_HASH_KEY,
    hashIv: runtime.ECPAY_HASH_IV,
    checkoutUrl: "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
  };
}

export function getPaymentPublicInfo() {
  const config = getEcpayConfig();
  return { provider: "ECPay", mode: config.mode, merchantConfigured: config.mode === "production" };
}

function ecpayUrlEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/'/g, "%27");
}

export async function createCheckMacValue(parameters: Record<string, string>, config = getEcpayConfig()) {
  const content = Object.keys(parameters)
    .filter((key) => key !== "CheckMacValue")
    .sort((left, right) => left.toLowerCase().localeCompare(right.toLowerCase()))
    .map((key) => `${key}=${parameters[key]}`)
    .join("&");
  const encoded = ecpayUrlEncode(`HashKey=${config.hashKey}&${content}&HashIV=${config.hashIv}`).toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encoded));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function taipeiDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}/${value("month")}/${value("day")} ${value("hour")}:${value("minute")}:${value("second")}`;
}

export async function buildEcpayCheckout(order: typeof namingOrders.$inferSelect, origin: string) {
  if (!order.paymentTradeNo || !order.paymentToken) throw new Error("This order is missing its payment identifiers.");
  const config = getEcpayConfig();
  const resultUrl = `${origin}/payment/result?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.paymentToken)}`;
  const parameters: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: order.paymentTradeNo,
    MerchantTradeDate: taipeiDateTime(new Date()),
    PaymentType: "aio",
    TotalAmount: String(order.amountTwd),
    TradeDesc: "NOCTUA celestial registry",
    ItemName: `NOCTUA ${order.packageName} registry`,
    ReturnURL: `${origin}/api/payments/ecpay/notify`,
    ClientBackURL: resultUrl,
    OrderResultURL: `${origin}/api/payments/ecpay/result`,
    ChoosePayment: "ALL",
    EncryptType: "1",
    NeedExtraPaidInfo: "N",
    CustomField1: order.id,
  };
  parameters.CheckMacValue = await createCheckMacValue(parameters, config);
  return { action: config.checkoutUrl, parameters, mode: config.mode };
}

function formValues(form: FormData) {
  return Object.fromEntries(Array.from(form.entries(), ([key, value]) => [key, String(value)]));
}

export async function processEcpayCallback(form: FormData) {
  const values = formValues(form);
  const config = getEcpayConfig();
  if (!values.CheckMacValue || values.MerchantID !== config.merchantId) return { ok: false, message: "Payment-source verification failed." };
  const expected = await createCheckMacValue(values, config);
  if (expected !== values.CheckMacValue.toUpperCase()) return { ok: false, message: "The payment checksum does not match." };

  const db = getDb();
  const [order] = await db.select().from(namingOrders).where(eq(namingOrders.paymentTradeNo, values.MerchantTradeNo ?? ""));
  if (!order) return { ok: false, message: "Payment order not found." };
  const amountMatches = Number(values.TradeAmt) === order.amountTwd;
  const gatewaySuccess = values.RtnCode === "1" && amountMatches;
  const simulated = config.mode === "test" || values.SimulatePaid === "1";
  const now = new Date().toISOString();
  let status = order.status;
  let registryCode = order.registryCode;

  if (gatewaySuccess && !simulated) {
    status = "confirmed";
    registryCode ??= `NOR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  } else if (gatewaySuccess) {
    status = "test_paid";
  } else if (order.status !== "confirmed") {
    status = amountMatches ? "payment_failed" : "payment_review";
  }

  await db.update(namingOrders).set({
    status,
    registryCode,
    confirmedAt: status === "confirmed" ? (order.confirmedAt ?? now) : order.confirmedAt,
    paymentTradeId: values.TradeNo?.slice(0, 30) || order.paymentTradeId,
    paymentType: values.PaymentType?.slice(0, 60) || order.paymentType,
    paymentMessage: amountMatches ? (values.RtnMsg?.slice(0, 200) || null) : "The payment amount does not match the order and requires manual review.",
    paymentUpdatedAt: now,
    paidAt: gatewaySuccess ? (order.paidAt ?? now) : order.paidAt,
    simulatedPayment: simulated,
  }).where(eq(namingOrders.id, order.id));

  return { ok: true, orderId: order.id, token: order.paymentToken, status, registryCode, mode: config.mode };
}

export async function getPaymentOrderStatus(orderId: string, token: string) {
  const db = getDb();
  const [order] = await db.select().from(namingOrders).where(eq(namingOrders.id, orderId));
  if (!order || !token || order.paymentToken !== token) return null;
  return {
    id: order.id,
    desiredName: order.desiredName,
    packageName: ({ "\u63a2\u7d22\u8005": "Explorer", "\u89c0\u6e2c\u8005": "Observer", "\u5178\u85cf\u8005": "Archivist" } as Record<string, string>)[order.packageName] ?? order.packageName,
    amountTwd: order.amountTwd,
    status: order.status,
    registryCode: order.registryCode,
    paymentProvider: order.paymentProvider,
    paymentType: order.paymentType,
    paymentMessage: order.paymentMessage,
    paymentUpdatedAt: order.paymentUpdatedAt,
    simulatedPayment: order.simulatedPayment,
    gateway: getPaymentPublicInfo(),
  };
}
