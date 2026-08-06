import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_ORDERING_DOMAIN,
  CUSTOMER_ORDERING_PROJECT,
  ensureCustomerOrderingProject,
  validateCustomerOrderingDomain,
  validateCustomerOrderingProject,
} from "./bootstrap-customer-ordering-project.mjs";

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() {
      return body === undefined ? "" : JSON.stringify(body);
    },
  };
}

const validProject = {
  id: "prj_customer_ordering",
  ...CUSTOMER_ORDERING_PROJECT,
  link: null,
};

const validDomain = {
  name: CUSTOMER_ORDERING_DOMAIN,
  verified: true,
  redirect: null,
  gitBranch: null,
};

test("existing disconnected project and sales domain are verified idempotently", async () => {
  const calls = [];
  const result = await ensureCustomerOrderingProject({
    token: "token",
    teamId: "team_test",
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method ?? "GET" });
      if (String(url).includes("/domains")) return response(200, { domains: [validDomain] });
      return response(200, validProject);
    },
  });

  assert.equal(result.created, false);
  assert.equal(result.domainAdded, false);
  assert.equal(result.project.id, validProject.id);
  assert.equal(result.domain.name, CUSTOMER_ORDERING_DOMAIN);
  assert.deepEqual(calls.map((call) => call.method), ["GET", "GET"]);
});

test("missing project and sales domain are created without Git linkage", async () => {
  const calls = [];
  const result = await ensureCustomerOrderingProject({
    token: "token",
    teamId: "team_test",
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      const target = String(url);
      if (target.includes("/domains")) {
        if (!options.method) return response(200, { domains: [] });
        return response(200, { ...validDomain, verified: false });
      }
      if (!options.method) return response(404, { error: { message: "not found" } });
      return response(200, validProject);
    },
  });

  assert.equal(result.created, true);
  assert.equal(result.domainAdded, true);
  assert.equal(calls.length, 4);
  const createBody = JSON.parse(calls[1].options.body);
  assert.deepEqual(createBody, CUSTOMER_ORDERING_PROJECT);
  assert.equal(Object.hasOwn(createBody, "gitRepository"), false);
  const domainBody = JSON.parse(calls[3].options.body);
  assert.deepEqual(domainBody, { name: CUSTOMER_ORDERING_DOMAIN });
});

test("wrong root or Git linkage fails closed", () => {
  assert.throws(
    () => validateCustomerOrderingProject({ ...validProject, rootDirectory: "." }),
    /root directory mismatch/,
  );
  assert.throws(
    () => validateCustomerOrderingProject({ ...validProject, link: { type: "github" } }),
    /disconnected from Git auto-deploy/,
  );
});

test("wrong, redirected or branch-bound domain fails closed", () => {
  assert.throws(
    () => validateCustomerOrderingDomain({ ...validDomain, name: "other.example.com" }),
    /domain mismatch/,
  );
  assert.throws(
    () => validateCustomerOrderingDomain({ ...validDomain, redirect: "example.com" }),
    /must not redirect/,
  );
  assert.throws(
    () => validateCustomerOrderingDomain({ ...validDomain, gitBranch: "main" }),
    /must not bind to a Git branch/,
  );
});

test("missing credentials fail before calling Vercel", async () => {
  await assert.rejects(
    ensureCustomerOrderingProject({ token: "", teamId: "team_test", fetchImpl: async () => response(500) }),
    /VERCEL_TOKEN/,
  );
});
