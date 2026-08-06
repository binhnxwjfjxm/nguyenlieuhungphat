#!/usr/bin/env node
import { verifyBoundary } from "./vercel-deploy-common.mjs";

const targetIndex = process.argv.indexOf("--target");
const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : "";
const dryRun = process.argv.includes("--dry-run");

verifyBoundary(target, { auditProvider: !dryRun }).catch((error) => {
  console.error(error instanceof Error ? error.message : "Boundary verification failed.");
  process.exitCode = 1;
});
