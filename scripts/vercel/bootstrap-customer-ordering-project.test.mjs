import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_ORDERING_PROJECT,
  ensureCustomerOrderingProject,
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

test("existing disconnected project is verified without creating another project", async () => {
  const calls = [];
  const result = await ensureCustomerOrderingProject({
    token: "token",
    teamId: "team_test",
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method ?? "GET" });
      return response(200, validProject);
    },
  });

  assert.equal(result.created, false);
  assert.equal(result.project.id, validProject.id);
  assert.deepEqual(calls.map((call) => call.method), ["GET"]);
});

test("missing project is created without a Git repository", async () => {
  const calls = [];
  const result = await ensureCustomerOrderingProject({
    token: "token",
    teamId: "team_test",
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (!options.method) return response(404, { error: { message: "not found" } });
      return response(200, validProject);
    },
  });

  assert.equal(result.created, true);
  assert.equal(calls.length, 2);
  const createBody = JSON.parse(calls[1].options.body);
  assert.deepEqual(createBody, CUSTOMER_ORDERING_PROJECT);
  assert.equal(Object.hasOwn(createBody, "gitRepository"), false);
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

test("missing credentials fail before calling Vercel", async () => {
  await assert.rejects(
    ensureCustomerOrderingProject({ token: "", teamId: "team_test", fetchImpl: async () => response(500) }),
    /VERCEL_TOKEN/,
  );
});
