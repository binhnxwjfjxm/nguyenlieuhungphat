import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchWithRetry,
  smokeOrderingAiGatewayProtection,
  smokeOrigin,
  validateCustomerOrderingProductionAiEnv,
} from "./vercel-deploy-common.mjs";

test("fetchWithRetry retries temporary network failures", async () => {
  let calls = 0;
  let delays = 0;
  const response = await fetchWithRetry("https://example.com/", {
    attempts: 3,
    delayMs: 1,
    timeoutMs: 100,
    fetchImpl: async () => {
      calls += 1;
      if (calls < 3) throw new Error("temporary network failure");
      return new Response("ok", { status: 200 });
    },
    sleepImpl: async () => { delays += 1; },
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.equal(delays, 2);
});

test("fetchWithRetry does not hide permanent authorization failures", async () => {
  let delays = 0;
  await assert.rejects(
    fetchWithRetry("https://example.com/private", {
      attempts: 4,
      fetchImpl: async () => new Response("forbidden", { status: 403 }),
      sleepImpl: async () => { delays += 1; },
    }),
    /Smoke rejected \/private: HTTP 403/,
  );
  assert.equal(delays, 0);
});

test("smokeOrigin waits for home, routes and a Next.js static asset", async () => {
  const requested = [];
  let homeCalls = 0;
  const fetchImpl = async (url) => {
    requested.push(url);
    if (url === "https://sales.example.com/") {
      homeCalls += 1;
      if (homeCalls === 1) throw new Error("DNS not ready");
      return new Response('<link rel="stylesheet" href="/_next/static/app.css">', { status: 200 });
    }
    return new Response("ok", { status: 200 });
  };

  await smokeOrigin("https://sales.example.com", ["/", "/login", "/orders"], {
    attempts: 3,
    delayMs: 1,
    timeoutMs: 100,
    fetchImpl,
    sleepImpl: async () => {},
  });

  assert.equal(homeCalls, 2);
  assert.deepEqual(requested.slice(-3), [
    "https://sales.example.com/login",
    "https://sales.example.com/orders",
    "https://sales.example.com/_next/static/app.css",
  ]);
});

test("smokeOrderingAiGatewayProtection verifies Ordering gateway rejects missing capability", async () => {
  let request;
  const body = await smokeOrderingAiGatewayProtection({
    origin: "https://website.example.com",
    sessionId: "ordering-protection-test",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: false, code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(body.code, "UNAUTHORIZED");
  assert.equal(request.url, "https://website.example.com/api/dialogflow/chat");
  assert.equal(request.options.headers.authorization, undefined);
  assert.equal(request.options.headers["x-ordering-ai-gateway"], "customer-ordering");
});

test("smokeOrderingAiGatewayProtection rejects an unexpectedly open gateway", async () => {
  await assert.rejects(
    smokeOrderingAiGatewayProtection({
      origin: "https://website.example.com",
      fetchImpl: async () => new Response(JSON.stringify({ ok: true, replyText: "unexpected" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    }),
    /Ordering AI gateway protection smoke failed: HTTP 200 unknown/,
  );
});

test("validateCustomerOrderingProductionAiEnv accepts protected secret metadata without readable value", () => {
  const result = validateCustomerOrderingProductionAiEnv([
    { key: "ORDERING_AI_API_TOKEN", type: "sensitive", target: ["production"] },
    { key: "CORE_API_BASE_URL", type: "plain", target: ["production"], value: "https://company.example.com" },
    { key: "WEBSITE_AI_BASE_URL", type: "plain", target: ["production"], value: "https://website.example.com" },
  ]);

  assert.deepEqual(result, {
    tokenType: "sensitive",
    coreApiBaseUrl: "https://company.example.com",
    websiteAiBaseUrl: "https://website.example.com",
  });
});

test("validateCustomerOrderingProductionAiEnv rejects unprotected token metadata", () => {
  assert.throws(
    () => validateCustomerOrderingProductionAiEnv([
      { key: "ORDERING_AI_API_TOKEN", type: "plain", target: ["production"], value: "must-not-be-readable" },
      { key: "CORE_API_BASE_URL", type: "plain", target: ["production"], value: "https://company.example.com" },
      { key: "WEBSITE_AI_BASE_URL", type: "plain", target: ["production"], value: "https://website.example.com" },
    ]),
    /must remain a protected Vercel secret/,
  );
});

test("validateCustomerOrderingProductionAiEnv rejects duplicate token metadata", () => {
  assert.throws(
    () => validateCustomerOrderingProductionAiEnv([
      { key: "ORDERING_AI_API_TOKEN", type: "sensitive", target: ["production"] },
      { key: "ORDERING_AI_API_TOKEN", type: "sensitive", target: ["production"] },
      { key: "CORE_API_BASE_URL", type: "plain", target: ["production"], value: "https://company.example.com" },
      { key: "WEBSITE_AI_BASE_URL", type: "plain", target: ["production"], value: "https://website.example.com" },
    ]),
    /must exist exactly once/,
  );
});
