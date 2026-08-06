import assert from "node:assert/strict";
import test from "node:test";
import { assertProviderBoundary, validateBoundaryConfig } from "./vercel-deploy-common.mjs";

const base = { repository: "binhnxwjfjxm/nguyenlieuhungphat", expectedRepository: "binhnxwjfjxm/nguyenlieuhungphat", branch: "main", exactSha: "a".repeat(40), checkedOutSha: "a".repeat(40), projectId: "prj_website", otherProjectId: "prj_customer" };

test("website boundary accepts only repo root", () => {
  assert.doesNotThrow(() => validateBoundaryConfig({ ...base, target: "website", rootDirectory: "." }));
  assert.throws(() => validateBoundaryConfig({ ...base, target: "website", rootDirectory: "customer-ordering" }), /Root directory/);
});

test("customer ordering boundary rejects website root and shared project IDs", () => {
  assert.throws(() => validateBoundaryConfig({ ...base, target: "customer-ordering", rootDirectory: "." }), /Root directory/);
  assert.throws(() => validateBoundaryConfig({ ...base, target: "customer-ordering", rootDirectory: "customer-ordering", otherProjectId: "prj_website" }), /must differ/);
});

test("exact SHA and repository fail closed", () => {
  assert.throws(() => validateBoundaryConfig({ ...base, target: "website", rootDirectory: ".", checkedOutSha: "b".repeat(40) }), /SHA mismatch/);
  assert.throws(() => validateBoundaryConfig({ ...base, target: "website", rootDirectory: ".", repository: "other/repo" }), /Repository boundary/);
});

test("provider root and production branch are audited", () => {
  assert.doesNotThrow(() => assertProviderBoundary({ rootDirectory: "customer-ordering", productionBranch: "main" }, "customer-ordering"));
  assert.throws(() => assertProviderBoundary({ rootDirectory: ".", productionBranch: "main" }, "customer-ordering"), /Vercel root mismatch/);
  assert.throws(() => assertProviderBoundary({ rootDirectory: ".", productionBranch: "develop" }, "."), /production branch/);
});
