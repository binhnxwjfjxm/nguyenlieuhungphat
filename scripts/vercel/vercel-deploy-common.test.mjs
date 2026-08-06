import assert from "node:assert/strict";
import test from "node:test";

import { fetchWithRetry, smokeOrigin } from "./vercel-deploy-common.mjs";

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
