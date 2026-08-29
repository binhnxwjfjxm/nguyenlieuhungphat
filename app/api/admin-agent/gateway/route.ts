import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminAgentReadiness, queryAdminAgent } from "@/lib/admin-agent-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY_HEADER = "x-company-admin-ai-gateway";
const GATEWAY_VALUE = "company-admin";
const SAFE_CONVERSATION_ID = /^[A-Za-z0-9._-]{1,128}$/;
const MAX_MESSAGE_LENGTH = 6000;

function jsonError(status: 400 | 401 | 503, code: string, error: string) {
  return NextResponse.json({ ok: false, code, error }, { status, headers: { "Cache-Control": "no-store" } });
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function authorized(request: NextRequest) {
  if (request.headers.get(GATEWAY_HEADER)?.trim() !== GATEWAY_VALUE) return false;
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const expected = process.env.COMPANY_WEBSITE_AI_API_TOKEN?.trim() ?? "";
  return Boolean(match && expected && safeEqual(match[1].trim(), expected));
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return jsonError(401, "UNAUTHORIZED", "Yêu cầu không hợp lệ.");
  try {
    const readiness = await adminAgentReadiness();
    return NextResponse.json({ ok: true, ...readiness }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("admin_agent_gateway_readiness_failed", error instanceof Error ? error.message : "unknown_error");
    return jsonError(503, "ADMIN_AI_GATEWAY_UNAVAILABLE", "Trợ lý Công Ty đang tạm gián đoạn.");
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return jsonError(401, "UNAUTHORIZED", "Yêu cầu không hợp lệ.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Nội dung cần hỏi chưa hợp lệ.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(400, "INVALID_REQUEST", "Nội dung cần hỏi chưa hợp lệ.");
  }
  const payload = body as Record<string, unknown>;
  const actorId = typeof payload.actorId === "string" ? payload.actorId.trim() : "";
  const conversationId = typeof payload.conversationId === "string" ? payload.conversationId.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!actorId || !SAFE_CONVERSATION_ID.test(conversationId) || !message || message.length > MAX_MESSAGE_LENGTH) {
    return jsonError(400, "INVALID_REQUEST", "Nội dung cần hỏi chưa hợp lệ.");
  }

  try {
    const result = await queryAdminAgent({ actorId, conversationId, message });
    return NextResponse.json({ ok: true, ...result, capability: "company-admin-ai", readOnly: true }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("admin_agent_gateway_query_failed", error instanceof Error ? error.message : "unknown_error");
    return jsonError(503, "ADMIN_AI_GATEWAY_UNAVAILABLE", "Trợ lý Công Ty đang tạm gián đoạn.");
  }
}
