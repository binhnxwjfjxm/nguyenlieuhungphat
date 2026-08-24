import "server-only";

import { GoogleAuth } from "google-auth-library";

export type GeminiUsageMetadata = {
  promptTokenCount: number;
  cachedContentTokenCount: number;
  candidatesTokenCount: number;
  thoughtsTokenCount: number;
  toolUsePromptTokenCount: number;
  totalTokenCount: number;
};

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

const GOOGLE_CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const VERTEX_API_BASE_URL = "https://aiplatform.googleapis.com/v1";
const DEFAULT_LOCATION = "global";
const DEFAULT_MODEL = "gemini-2.5-flash";
const SAFE_PROJECT_ID = /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/;
const SAFE_LOCATION = /^[a-z0-9-]{2,40}$/;
const SAFE_MODEL = /^[A-Za-z0-9._-]{1,128}$/;

const WEBSITE_SYSTEM_INSTRUCTION = [
  "Bạn là Trợ lý Hưng Phát trên website dành cho khách hàng.",
  "Trả lời bằng tiếng Việt rõ ràng, ngắn gọn và dùng ngôn ngữ văn phòng dễ hiểu.",
  "Ưu tiên hỗ trợ thông tin sản phẩm, cách liên hệ, nhu cầu mua hàng và hướng dẫn sử dụng website.",
  "Không tự bịa giá, tồn kho, chính sách hoặc thông tin sản phẩm khi dữ liệu trong hội thoại không đủ.",
  "Khi cần xác nhận thông tin cụ thể, hãy nói rõ cần nhân viên Hưng Phát kiểm tra và mời khách để lại số điện thoại.",
  "Không nhắc tới database, token, API, model, cấu hình hoặc lỗi kỹ thuật nội bộ.",
].join("\n");

let cachedServiceAccount: ServiceAccount | null = null;

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function normalizeDialogflowSessionId(sessionId: string) {
  return sessionId.trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 36) || "hungphat-session";
}

function loadServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) return cachedServiceAccount;
  const inlineJson = getEnvValue("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!inlineJson) throw new Error("google_service_account_missing");
  const parsed = JSON.parse(inlineJson) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) throw new Error("google_service_account_invalid");
  cachedServiceAccount = parsed;
  return parsed;
}

function getGeminiConfig() {
  const serviceAccount = loadServiceAccount();
  const projectId = getEnvValue("GOOGLE_CLOUD_PROJECT") || serviceAccount.project_id || "";
  const location = getEnvValue("GOOGLE_CLOUD_LOCATION") || DEFAULT_LOCATION;
  const model = getEnvValue("GEMINI_WEBSITE_MODEL") || DEFAULT_MODEL;
  if (!SAFE_PROJECT_ID.test(projectId)) throw new Error("google_cloud_project_invalid");
  if (!SAFE_LOCATION.test(location)) throw new Error("google_cloud_location_invalid");
  if (!SAFE_MODEL.test(model)) throw new Error("gemini_model_invalid");
  return Object.freeze({ projectId, location, model });
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: loadServiceAccount(),
    scopes: [GOOGLE_CLOUD_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token ?? "";
  if (!value) throw new Error("google_access_token_missing");
  return value;
}

function tokenCount(value: unknown, field: string) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`gemini_usage_${field}_invalid`);
  return number;
}

function normalizeUsageMetadata(value: unknown): GeminiUsageMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("gemini_usage_metadata_missing");
  const metadata = value as Record<string, unknown>;
  const promptTokenCount = tokenCount(metadata.promptTokenCount, "prompt");
  const cachedContentTokenCount = tokenCount(metadata.cachedContentTokenCount, "cached");
  const candidatesTokenCount = tokenCount(metadata.candidatesTokenCount, "candidates");
  const thoughtsTokenCount = tokenCount(metadata.thoughtsTokenCount, "thoughts");
  const toolUsePromptTokenCount = tokenCount(metadata.toolUsePromptTokenCount, "tool");
  const totalTokenCount = tokenCount(metadata.totalTokenCount, "total");
  const expectedTotal = promptTokenCount + candidatesTokenCount + thoughtsTokenCount + toolUsePromptTokenCount;
  if (cachedContentTokenCount > promptTokenCount || totalTokenCount !== expectedTotal) {
    throw new Error("gemini_usage_metadata_inconsistent");
  }
  return Object.freeze({
    promptTokenCount,
    cachedContentTokenCount,
    candidatesTokenCount,
    thoughtsTokenCount,
    toolUsePromptTokenCount,
    totalTokenCount,
  });
}

function responseText(payload: Record<string, unknown>) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = candidates[0] as { content?: { parts?: Array<{ text?: unknown }> } } | undefined;
  return (first?.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function detectDialogflowReply(input: {
  sessionId: string;
  message: string;
  transcript?: string;
}) {
  const config = getGeminiConfig();
  const accessToken = await getAccessToken();
  const conversation = input.transcript?.trim() || input.message.trim();
  const url = `${VERTEX_API_BASE_URL}/projects/${encodeURIComponent(config.projectId)}/locations/${encodeURIComponent(config.location)}/publishers/google/models/${encodeURIComponent(config.model)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: WEBSITE_SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: conversation }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 768 },
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`vertex_gemini_unavailable_${response.status}`);
  const payload = JSON.parse(text) as Record<string, unknown>;
  const usageMetadata = normalizeUsageMetadata(payload.usageMetadata);
  const replyText = responseText(payload);
  if (!replyText) throw new Error("gemini_reply_empty");
  const providerRequestId = typeof payload.responseId === "string" ? payload.responseId.trim() : "";
  if (!providerRequestId) throw new Error("gemini_response_id_missing");
  return Object.freeze({
    replyText,
    providerRequestId,
    model: config.model,
    usageMetadata,
    occurredAt: typeof payload.createTime === "string" && payload.createTime.trim()
      ? payload.createTime.trim()
      : new Date().toISOString(),
  });
}
