#!/usr/bin/env node
import { deployTarget } from "./vercel-deploy-common.mjs";

deployTarget("website").catch((error) => {
  console.error(error instanceof Error ? error.message : "Website deployment failed.");
  process.exitCode = 1;
});
