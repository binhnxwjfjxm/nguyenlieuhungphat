import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 64 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coreBaseUrl(): string {
  const raw = process.env.CORE_API_BASE_URL?.trim();
  if (!raw) throw new Error("CUSTOMER_PORTAL_PROXY_NOT_CONFIGURED");
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("CUSTOMER_PORTAL_PROXY_NOT_CONFIGURED");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("CUSTOMER_PORTAL_PROXY_NOT_CONFIGURED");
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString().replace(/\/$/, "");
}

function allowed(path: string[], method: string): boolean {
  if (method === "GET" && path.length === 1 && ["me", "addresses", "catalog", "orders"].includes(path[0])) return true;
  if (method === "GET" && path.length === 2 && path[0] === "orders" && UUID_PATTERN.test(path[1])) return true;
  if (method === "POST" && path.length === 1 && path[0] === "orders") return true;
  return method === "POST" && path.length === 3 && path[0] === "orders" && UUID_PATTERN.test(path[1]) && path[2] === "cancel";
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path = [] } = await context.params;
  if (!allowed(path, request.method)) return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", retryable: false } }, { status: 405 });
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.toLowerCase().startsWith("bearer ")) return Response.json({ error: { code: "CUSTOMER_PORTAL_AUTH_REQUIRED", message: "Authorization required", retryable: false } }, { status: 401 });

  let body: string | undefined;
  if (request.method === "POST") {
    body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return Response.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Payload too large", retryable: false } }, { status: 413 });
  }

  let base: string;
  try {
    base = coreBaseUrl();
  } catch {
    return Response.json({ error: { code: "CUSTOMER_PORTAL_PROXY_NOT_CONFIGURED", message: "Customer Portal chưa được cấu hình.", retryable: false } }, { status: 503 });
  }
  const incoming = new URL(request.url);
  const target = new URL(`${base}/api/customer-portal/${path.map(encodeURIComponent).join("/")}`);
  target.search = incoming.search;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target, {
      method: request.method,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "x-request-id": request.headers.get("x-request-id")?.trim() || `portal_web_${randomUUID()}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(request.headers.get("idempotency-key") ? { "Idempotency-Key": request.headers.get("idempotency-key")! } : {}),
      },
      ...(body === undefined ? {} : { body }),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: { code: "CUSTOMER_PORTAL_UNAVAILABLE", message: "Không kết nối được hệ thống đặt hàng.", retryable: true } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = proxy;
export const POST = proxy;
