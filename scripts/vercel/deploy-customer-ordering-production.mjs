#!/usr/bin/env node
import { deployTarget } from "./vercel-deploy-common.mjs";

deployTarget("customer-ordering").catch((error) => {
  console.error(error instanceof Error ? error.message : "Customer Ordering deployment failed.");
  process.exitCode = 1;
});
